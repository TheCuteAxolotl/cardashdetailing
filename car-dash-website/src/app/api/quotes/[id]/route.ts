import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentAccountFromRequest,
  isOwnerAccount,
  hasStaffPermission,
} from "@/lib/permissions";
import { notifyQuoteDiscord } from "@/lib/discord-quotes";
import { getQuoteSmsContact } from "@/lib/quote-sms";
import { getPublicSiteUrl, isRecentlyActive, sendTransactionalSms } from "@/lib/twilio-sms";
import { ensureGuestQuoteSupport } from "@/lib/quote-guest";

async function access(request: NextRequest, id: string) {
  await ensureGuestQuoteSupport();
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return null;

  const thread = await prisma.quoteThread.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      quotedPrice: true,
      lastCustomerSeenAt: true,
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      guestVehicle: true,
    },
  });

  if (!thread) return null;
  const staff = hasStaffPermission(auth, "quoteChats");
  if (!staff && thread.userId !== auth.id) return null;

  return { auth, thread, staff };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const allowed = await access(request, id);
  if (!allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  if (!allowed.staff) {
    await prisma.quoteThread.update({
      where: { id },
      data: { lastCustomerSeenAt: new Date() },
    });
  }

  const thread = await prisma.quoteThread.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      vehicle: true,
      service: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(thread);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const allowed = await access(request, id);
  if (!allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  if (["closed", "booked"].includes(allowed.thread.status)) {
    return NextResponse.json(
      {
        error:
          allowed.thread.status === "booked"
            ? "This quote has already been booked and the conversation is read-only."
            : "This conversation is closed and is now read-only.",
      },
      { status: 409 }
    );
  }

  const body = await request.json();
  const message = String(body.message || "").trim().slice(0, 3000);
  const attachments: unknown[] = Array.isArray(body.attachments) ? body.attachments.slice(0, 3) : [];
  if (attachments.some((item) => typeof item !== "string" || !/^data:image\/(?:jpeg|png|webp);base64,/i.test(item) || item.length > 650000)) {
    return NextResponse.json({ error: "Each quote photo must be a JPG, PNG, or WebP image under the upload limit." }, { status: 400 });
  }

  if (!message && !attachments.length) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  await prisma.quoteMessage.create({
    data: {
      threadId: id,
      sender: allowed.staff ? "team" : "customer",
      body: message || "Photo attachment",
      attachmentsJson: attachments.length ? JSON.stringify(attachments) : null,
    },
  });

  await prisma.quoteThread.update({
    where: { id },
    data: allowed.staff
      ? { updatedAt: new Date() }
      : { lastCustomerSeenAt: new Date(), updatedAt: new Date() },
  });

  // Discord notifications are sent only for customer activity so owner/admin replies do not spam the channel.
  if (!allowed.staff) {
    const details = await prisma.quoteThread.findUnique({
      where: { id },
      select: {
        id: true,
        subject: true,
        guestName: true,
        guestEmail: true,
        guestVehicle: true,
        user: { select: { name: true, email: true } },
        vehicle: { select: { year: true, make: true, model: true, trim: true } },
        service: { select: { title: true } },
      },
    });

    if (details) {
      await notifyQuoteDiscord({
        title: attachments.length ? "New customer quote reply + photos" : "New customer quote reply",
        customerName: details.user?.name || details.guestName || "Guest",
        customerEmail: details.user?.email || details.guestEmail || undefined,
        subject: details.subject,
        message: message || "Photo attachment",
        vehicle: details.vehicle
          ? [details.vehicle.year, details.vehicle.make, details.vehicle.model, details.vehicle.trim]
              .filter(Boolean)
              .join(" ")
          : details.guestVehicle || undefined,
        service: details.service?.title || undefined,
        photoCount: attachments.length,
        threadId: details.id,
      });
    }
  }

  // Notify opted-in customers by SMS only when staff replies and the customer is not actively in chat.
  if (allowed.staff && !isRecentlyActive(allowed.thread.lastCustomerSeenAt)) {
    const sms = await getQuoteSmsContact(id);
    if (sms.consent && sms.phone) {
      const guestThread = !allowed.thread.userId;
      await sendTransactionalSms({
        to: sms.phone,
        body: guestThread
          ? `Car Dash Detailing: ${message || "We replied to your exact-quote request."} Reply to this text if you have a question.`.slice(0, 1450)
          : `Car Dash Detailing: We replied to your quote chat. View your private conversation: ${getPublicSiteUrl()}/quote?thread=${encodeURIComponent(id)}`,
      });
    }
  }

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const allowed = await access(request, id);
  if (!allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await request.json();

  if (allowed.staff) {
    const action = String(body.action || "").trim();

    if (action === "close") {
      if (allowed.thread.status === "booked") {
        return NextResponse.json(
          { error: "Booked quote conversations are already read-only." },
          { status: 409 }
        );
      }
      const updated = await prisma.quoteThread.update({
        where: { id },
        data: { status: "closed" },
      });
      return NextResponse.json(updated);
    }

    if (action === "reopen") {
      if (allowed.thread.status === "booked") {
        return NextResponse.json(
          { error: "A booked quote cannot be reopened. Manage the appointment from Bookings." },
          { status: 409 }
        );
      }
      const updated = await prisma.quoteThread.update({
        where: { id },
        data: { status: allowed.thread.quotedPrice ? "quoted" : "open" },
      });
      return NextResponse.json(updated);
    }

    if (allowed.thread.status === "booked") {
      return NextResponse.json(
        { error: "This accepted quote has already been booked and is locked." },
        { status: 409 }
      );
    }

    const quotedPrice =
      body.quotedPrice === "" || body.quotedPrice == null ? null : Number(body.quotedPrice);

    if (!Number.isFinite(quotedPrice) || !quotedPrice || quotedPrice <= 0) {
      return NextResponse.json(
        { error: "Enter a valid final quote price greater than $0." },
        { status: 400 }
      );
    }

    const updated = await prisma.quoteThread.update({
      where: { id },
      data: {
        status: "quoted",
        quotedPrice,
        quoteNotes: String(body.quoteNotes || "").trim() || null,
        acceptedAt: null,
      },
    });

    if (!isRecentlyActive(allowed.thread.lastCustomerSeenAt)) {
      const sms = await getQuoteSmsContact(id);
      if (sms.consent && sms.phone) {
        const guestThread = !allowed.thread.userId;
        const guestEmail = allowed.thread.guestEmail || "";
        await sendTransactionalSms({
          to: sms.phone,
          body: guestThread
            ? `Car Dash Detailing: Your exact quote is $${quotedPrice.toFixed(2)}${String(body.quoteNotes || "").trim() ? ` — ${String(body.quoteNotes).trim()}` : ""}. Reply to this text to book or ask a question. Want to track it online? ${getPublicSiteUrl()}/register?claimQuoteId=${encodeURIComponent(id)}&email=${encodeURIComponent(guestEmail)}`.slice(0, 1450)
            : `Car Dash Detailing: Your final quote is $${quotedPrice.toFixed(2)}. Review or accept it here: ${getPublicSiteUrl()}/quote?thread=${encodeURIComponent(id)}`,
        });
      }
    }

    return NextResponse.json(updated);
  }

  if (body.action === "accept") {
    if (allowed.thread.status !== "quoted") {
      return NextResponse.json(
        { error: "Only an active final quote can be accepted." },
        { status: 409 }
      );
    }
    if (!allowed.thread.quotedPrice || allowed.thread.quotedPrice <= 0) {
      return NextResponse.json({ error: "This quote does not have a valid final price." }, { status: 409 });
    }

    const updated = await prisma.quoteThread.update({
      where: { id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
        lastCustomerSeenAt: new Date(),
      },
    });

    const details = await prisma.quoteThread.findUnique({
      where: { id },
      select: {
        id: true,
        subject: true,
        quotedPrice: true,
        guestName: true,
        guestEmail: true,
        guestVehicle: true,
        user: { select: { name: true, email: true } },
        vehicle: { select: { year: true, make: true, model: true, trim: true } },
        service: { select: { title: true } },
      },
    });

    if (details) {
      await notifyQuoteDiscord({
        title: "Quote accepted",
        customerName: details.user?.name || details.guestName || "Guest",
        customerEmail: details.user?.email || details.guestEmail || undefined,
        subject: details.subject,
        vehicle: details.vehicle
          ? [details.vehicle.year, details.vehicle.make, details.vehicle.model, details.vehicle.trim]
              .filter(Boolean)
              .join(" ")
          : details.guestVehicle || undefined,
        service: details.service?.title || undefined,
        quotedPrice: details.quotedPrice,
        threadId: details.id,
      });
    }

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) {
    return NextResponse.json({ error: "Only the owner can permanently delete quote chats." }, { status: 403 });
  }

  const { id } = await context.params;
  await ensureGuestQuoteSupport();
  const existing = await prisma.quoteThread.findUnique({
    where: { id },
    select: { id: true, subject: true },
  });
  if (!existing) return NextResponse.json({ error: "Quote chat not found." }, { status: 404 });

  await prisma.quoteThread.delete({ where: { id } });
  return NextResponse.json({ success: true, message: "Quote chat deleted permanently." });
}
