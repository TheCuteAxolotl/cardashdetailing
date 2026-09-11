import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isStaffAccount } from "@/lib/permissions";

const select = {
  id: true, subject: true, status: true, quotedPrice: true, quoteNotes: true, acceptedAt: true,
  lastCustomerSeenAt: true, createdAt: true, updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
  vehicle: true,
  service: { select: { id: true, title: true, category: true, pricingType: true } },
  messages: { orderBy: { createdAt: "asc" as const }, select: { id: true, sender: true, body: true, attachmentsJson: true, createdAt: true } },
};

export async function GET(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const threads = await prisma.quoteThread.findMany({
    where: isStaffAccount(auth) ? {} : { userId: auth.id },
    select, orderBy: { updatedAt: "desc" }, take: 100,
  });
  return NextResponse.json(threads);
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Please log in to chat with a specialist." }, { status: 401 });
  if (isStaffAccount(auth)) return NextResponse.json({ error: "Staff should use the quote inbox." }, { status: 400 });
  const body = await request.json();
  const subject = String(body.subject || "Detailing quote").trim().slice(0, 120);
  const message = String(body.message || "").trim().slice(0, 3000);
  const vehicleId = String(body.vehicleId || "").trim() || null;
  const serviceId = String(body.serviceId || "").trim() || null;
  const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 3) : [];
  if (!message) return NextResponse.json({ error: "Tell us what you need help with." }, { status: 400 });
  if (vehicleId) {
    const owned = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId: auth.id }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: "Vehicle not found." }, { status: 400 });
  }
  const thread = await prisma.quoteThread.create({
    data: {
      userId: auth.id, vehicleId, serviceId, subject,
      lastCustomerSeenAt: new Date(),
      messages: { create: { sender: "customer", body: message, attachmentsJson: attachments.length ? JSON.stringify(attachments) : null } },
    }, select,
  });
  const webhook = (process.env.DISCORD_SUPPORT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL)?.trim();
  if (webhook) {
    fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "Car Dash Quotes", content: `**New quote chat**\n${auth.name} (${auth.email})\n${subject}\n${message.slice(0, 1200)}\n\nOwner inbox: https://cardashdetailing.com/owner/quotes` }) }).catch(() => {});
  }
  return NextResponse.json(thread, { status: 201 });
}
