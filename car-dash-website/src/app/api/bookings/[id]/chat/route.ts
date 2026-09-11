import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isStaffAccount } from "@/lib/permissions";
import {
  bookingHasSmsConsent,
  ensureBookingConversation,
  getBookingChatUrl,
  notifyBookingChatDiscord,
  verifyBookingChatKey,
} from "@/lib/booking-chat";
import { isRecentlyActive, sendTransactionalSms } from "@/lib/twilio-sms";

async function getAccess(request: NextRequest, bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      serviceName: true,
      serviceMethod: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      vehicleMake: true,
      vehicleModel: true,
      vehicleYear: true,
      vehicleTrim: true,
      preferredDate: true,
      preferredTime: true,
      quotedPrice: true,
      notes: true,
      status: true,
      createdAt: true,
    },
  });

  if (!booking) return null;

  const auth = await getCurrentAccountFromRequest(request);
  if (isStaffAccount(auth)) {
    return { booking, viewer: "staff" as const, authRole: auth?.role || "staff" };
  }

  if (auth && booking.userId === auth.id) {
    return { booking, viewer: "customer" as const, authRole: auth.role };
  }

  const key = request.nextUrl.searchParams.get("key");
  if (verifyBookingChatKey(booking.id, booking.customerEmail, key)) {
    return { booking, viewer: "customer" as const, authRole: "guest" };
  }

  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const allowed = await getAccess(request, id);
    if (!allowed) {
      return NextResponse.json({ error: "Booking chat not found or you do not have access." }, { status: 403 });
    }

    const conversation = await ensureBookingConversation(id);

    if (allowed.viewer === "customer") {
      await prisma.bookingConversation.update({
        where: { id: conversation.id },
        data: { lastCustomerSeenAt: new Date() },
      });
    }

    const refreshed = await prisma.bookingConversation.findUnique({
      where: { id: conversation.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json({
      booking: {
        id: allowed.booking.id,
        serviceName: allowed.booking.serviceName,
        serviceMethod: allowed.booking.serviceMethod,
        customerName: allowed.booking.customerName,
        customerEmail: allowed.booking.customerEmail,
        customerPhone: allowed.booking.customerPhone,
        vehicleMake: allowed.booking.vehicleMake,
        vehicleModel: allowed.booking.vehicleModel,
        vehicleYear: allowed.booking.vehicleYear,
        vehicleTrim: allowed.booking.vehicleTrim,
        preferredDate: allowed.booking.preferredDate,
        preferredTime: allowed.booking.preferredTime,
        quotedPrice: allowed.booking.quotedPrice,
        status: allowed.booking.status,
        createdAt: allowed.booking.createdAt,
      },
      messages: refreshed?.messages || [],
      lastCustomerSeenAt: refreshed?.lastCustomerSeenAt || null,
      viewer: allowed.viewer,
      authRole: allowed.authRole,
    });
  } catch (error) {
    console.error("Booking chat load failed:", error);
    return NextResponse.json({ error: "Could not load booking chat." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const allowed = await getAccess(request, id);
    if (!allowed) {
      return NextResponse.json({ error: "Booking chat not found or you do not have access." }, { status: 403 });
    }

    const body = await request.json();
    const message = String(body.message || "").trim().slice(0, 3000);
    if (!message) {
      return NextResponse.json({ error: "Message required." }, { status: 400 });
    }

    const conversation = await ensureBookingConversation(id);

    await prisma.bookingMessage.create({
      data: {
        conversationId: conversation.id,
        sender: allowed.viewer === "staff" ? "team" : "customer",
        body: message,
      },
    });

    const now = new Date();
    await prisma.bookingConversation.update({
      where: { id: conversation.id },
      data:
        allowed.viewer === "customer"
          ? { lastCustomerSeenAt: now, updatedAt: now }
          : { updatedAt: now },
    });

    if (allowed.viewer === "customer") {
      await notifyBookingChatDiscord({
        bookingId: allowed.booking.id,
        customerName: allowed.booking.customerName,
        customerEmail: allowed.booking.customerEmail,
        serviceName: allowed.booking.serviceName,
        vehicle: [
          allowed.booking.vehicleYear,
          allowed.booking.vehicleMake,
          allowed.booking.vehicleModel,
          allowed.booking.vehicleTrim,
        ]
          .filter(Boolean)
          .join(" "),
        message,
      });
    } else if (
      !isRecentlyActive(conversation.lastCustomerSeenAt) &&
      bookingHasSmsConsent(allowed.booking.notes)
    ) {
      await sendTransactionalSms({
        to: allowed.booking.customerPhone,
        body: `Car Dash Detailing: We sent you a message about your ${allowed.booking.serviceName} booking. View and reply here: ${getBookingChatUrl(
          allowed.booking.id,
          allowed.booking.customerEmail,
          Boolean(allowed.booking.userId)
        )}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Booking chat send failed:", error);
    return NextResponse.json({ error: "Could not send booking message." }, { status: 500 });
  }
}
