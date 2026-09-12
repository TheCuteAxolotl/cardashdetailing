import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission, isStaffAccount } from "@/lib/permissions";
import { notifyQuoteDiscord } from "@/lib/discord-quotes";
import { normalizePhoneNumber } from "@/lib/twilio-sms";
import { ensureGuestQuoteSupport, normalizeEmail } from "@/lib/quote-guest";
import { getClientIp, hashVisitor } from "@/lib/support-security";

const select = {
  id: true, subject: true, status: true, quotedPrice: true, quoteNotes: true, acceptedAt: true,
  lastCustomerSeenAt: true, createdAt: true, updatedAt: true,
  guestName: true, guestEmail: true, guestPhone: true, guestVehicle: true,
  user: { select: { id: true, name: true, email: true } },
  vehicle: true,
  service: { select: { id: true, title: true, category: true, pricingType: true } },
  messages: { orderBy: { createdAt: "asc" as const }, select: { id: true, sender: true, body: true, attachmentsJson: true, createdAt: true } },
};

export async function GET(request: NextRequest) {
  await ensureGuestQuoteSupport();
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const threads = await prisma.quoteThread.findMany({
    where: hasStaffPermission(auth, "quoteChats") ? {} : { userId: auth.id },
    select, orderBy: { updatedAt: "desc" }, take: 100,
  });
  return NextResponse.json(threads);
}

export async function POST(request: NextRequest) {
  await ensureGuestQuoteSupport();
  const auth = await getCurrentAccountFromRequest(request);
  if (auth && isStaffAccount(auth)) return NextResponse.json({ error: "Staff should use the quote inbox." }, { status: 400 });

  const body = await request.json();
  const subject = String(body.subject || "Exact detailing quote").trim().slice(0, 120);
  const message = String(body.message || "").trim().slice(0, 3000);
  const vehicleId = auth ? String(body.vehicleId || "").trim() || null : null;
  const serviceId = String(body.serviceId || "").trim() || null;
  const attachments: unknown[] = Array.isArray(body.attachments) ? body.attachments.slice(0, 3) : [];
  if (attachments.some((item) => typeof item !== "string" || !/^data:image\/(?:jpeg|png|webp);base64,/i.test(item) || item.length > 650000)) {
    return NextResponse.json({ error: "Each quote photo must be a JPG, PNG, or WebP image under the upload limit." }, { status: 400 });
  }
  const smsConsent = body.smsConsent === true;
  const phone = String(body.phone || body.guestPhone || "").trim().slice(0, 40);

  const guestName = auth ? null : String(body.guestName || "").trim().slice(0, 120);
  const guestEmail = auth ? null : normalizeEmail(body.guestEmail);
  const guestPhone = auth ? null : (normalizePhoneNumber(phone) || phone);
  const guestVisitorHash = auth ? null : hashVisitor(getClientIp(request));
  const guestVehicle = auth ? null : [body.vehicleYear, body.vehicleMake, body.vehicleModel, body.vehicleType]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 220);

  if (!auth) {
    const blocked = guestVisitorHash ? await prisma.blockedVisitor.findUnique({ where: { hash: guestVisitorHash } }) : null;
    if (blocked) return NextResponse.json({ error: "Quote requests are unavailable from this connection." }, { status: 403 });
    const recentGuestRequests = guestVisitorHash
      ? await prisma.quoteThread.count({ where: { guestVisitorHash, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } } })
      : 0;
    if (recentGuestRequests >= 5) return NextResponse.json({ error: "Too many quote requests. Please wait a few minutes and try again." }, { status: 429 });

    if (!guestName) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
    if (!guestEmail || !guestEmail.includes("@")) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    if (!guestPhone || !normalizePhoneNumber(guestPhone)) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
    if (!String(body.vehicleMake || "").trim() || !String(body.vehicleModel || "").trim()) {
      return NextResponse.json({ error: "Enter your vehicle make and model." }, { status: 400 });
    }
  }

  if (smsConsent && !phone) return NextResponse.json({ error: "Enter a mobile number to opt in to SMS updates." }, { status: 400 });
  if (smsConsent && !normalizePhoneNumber(phone)) return NextResponse.json({ error: "Enter a valid mobile number for SMS updates." }, { status: 400 });
  if (!message) return NextResponse.json({ error: "Tell us what you want done or what you want quoted." }, { status: 400 });

  if (vehicleId) {
    const owned = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId: auth!.id }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: "Vehicle not found." }, { status: 400 });
  }

  const thread = await prisma.quoteThread.create({
    data: {
      userId: auth?.id || null,
      vehicleId,
      serviceId,
      subject,
      guestName,
      guestEmail,
      guestPhone,
      guestVehicle,
      guestVisitorHash,
      lastCustomerSeenAt: auth ? new Date() : null,
      messages: {
        create: [
          { sender: "customer", body: message, attachmentsJson: attachments.length ? JSON.stringify(attachments) : null },
          { sender: "system", body: `SMS contact: ${(normalizePhoneNumber(phone) || phone) || "Not provided"} · consent: ${smsConsent ? "Yes" : "No"}` },
          ...(!auth && guestVehicle ? [{ sender: "system", body: `Guest vehicle: ${guestVehicle}` }] : []),
        ],
      },
    }, select,
  });

  await notifyQuoteDiscord({
    title: auth ? "New quote chat" : "New guest exact-quote request",
    customerName: auth?.name || guestName || "Guest",
    customerEmail: auth?.email || guestEmail || undefined,
    subject,
    message,
    vehicle: thread.vehicle
      ? [thread.vehicle.year, thread.vehicle.make, thread.vehicle.model, thread.vehicle.trim].filter(Boolean).join(" ")
      : guestVehicle || undefined,
    service: thread.service?.title || undefined,
    photoCount: attachments.length,
    threadId: thread.id,
  });

  return NextResponse.json({ ...thread, guestSubmission: !auth }, { status: 201 });
}
