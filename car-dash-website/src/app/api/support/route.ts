import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { cleanText, createAccessKey, getClientIp, hashAccessKey, hashVisitor } from "@/lib/support-security";

async function notifyDiscord(data: { id: string; name: string; email?: string; phone?: string; preference: string; subject: string; message: string; ip: string; visitorHash: string }) {
  const url = (process.env.DISCORD_SUPPORT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL)?.trim();
  if (!url) return;
  const body = [
    "**New website support request**",
    `Ticket: ${data.id}`,
    `Name: ${data.name}`,
    `Reply preference: ${data.preference}`,
    `Email: ${data.email || "Not provided"}`,
    `Phone: ${data.phone || "Not provided"}`,
    `Topic: ${data.subject}`,
    `Message: ${data.message}`,
    "",
    `IP: ${data.ip}`,
    `Visitor hash: ${data.visitorHash}`,
    "Owner support: https://cardashdetailing.com/owner/support",
  ].join("\n");
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: body.slice(0, 1950) }) });
  } catch (error) {
    console.error("Support Discord notification failed:", error);
  }
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth || auth.role !== "owner") return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const tickets = await prisma.supportTicket.findMany({
    select: { id: true, name: true, email: true, phone: true, contactPreference: true, subject: true, status: true, createdAt: true, updatedAt: true, messages: { orderBy: { createdAt: "asc" }, select: { id: true, sender: true, body: true, createdAt: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const visitorHash = hashVisitor(ip);
    const blocked = await prisma.blockedVisitor.findUnique({ where: { hash: visitorHash } });
    if (blocked) return NextResponse.json({ error: "Support requests are unavailable from this connection." }, { status: 403 });

    const recent = await prisma.supportTicket.count({ where: { visitorHash, createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } } });
    if (recent >= 4) return NextResponse.json({ error: "Too many support requests. Try again later." }, { status: 429 });

    const body = await request.json();
    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 160);
    const phone = cleanText(body.phone, 40);
    const preference = cleanText(body.contactPreference || "website", 20);
    const subject = cleanText(body.subject, 120);
    const message = cleanText(body.message, 1500);
    if (!name || !subject || !message) return NextResponse.json({ error: "Name, topic, and message are required." }, { status: 400 });
    if (preference === "email" && !email) return NextResponse.json({ error: "Add an email so the team can reach you." }, { status: 400 });
    if ((preference === "phone" || preference === "text") && !phone) return NextResponse.json({ error: "Add a phone number so the team can reach you." }, { status: 400 });

    const accessKey = createAccessKey();
    const ticket = await prisma.supportTicket.create({
      data: { accessKeyHash: hashAccessKey(accessKey), visitorHash, name, email: email || null, phone: phone || null, contactPreference: preference, subject, messages: { create: { sender: "visitor", body: message } } },
      select: { id: true, name: true, subject: true, status: true, createdAt: true },
    });
    await notifyDiscord({ id: ticket.id, name, email, phone, preference, subject, message, ip, visitorHash });
    return NextResponse.json({ ticket, accessKey }, { status: 201 });
  } catch (error) {
    console.error("Support request error:", error);
    return NextResponse.json({ error: "Could not send the support request." }, { status: 500 });
  }
}
