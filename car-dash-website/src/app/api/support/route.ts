import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isStaffAccount } from "@/lib/permissions";
import {
  cleanText,
  getClientIp,
  hashSupportAccount,
  hashVisitor,
} from "@/lib/support-security";

async function notifyDiscord(data: {
  id: string;
  accountId: string;
  name: string;
  email: string;
  phone?: string;
  preference: string;
  subject: string;
  message: string;
  ip: string;
  visitorHash: string;
}) {
  const url = (
    process.env.DISCORD_SUPPORT_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL
  )?.trim();

  if (!url) {
    console.warn("Support Discord webhook is not configured.");
    return;
  }

  const body = [
    "**New website support request**",
    `Ticket: ${data.id}`,
    `Account: ${data.accountId}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Reply preference: ${data.preference}`,
    `Phone: ${data.phone || "Not provided"}`,
    `Topic: ${data.subject}`,
    `Message: ${data.message}`,
    "",
    `IP: ${data.ip}`,
    `Visitor hash: ${data.visitorHash}`,
    "Owner support: https://cardashdetailing.com/owner/support",
  ].join("\n");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: body.slice(0, 1950),
        username: "Car Dash Support",
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.error(
        `Support Discord notification failed with ${response.status}: ${details.slice(0, 300)}`
      );
    }
  } catch (error) {
    console.error("Support Discord notification failed:", error);
  }
}

const ticketSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  contactPreference: true,
  subject: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  messages: {
    orderBy: { createdAt: "asc" as const },
    select: { id: true, sender: true, body: true, createdAt: true },
  },
};

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: "You must be logged in to use support." },
        { status: 401 }
      );
    }

    if (isStaffAccount(auth)) {
      const tickets = await prisma.supportTicket.findMany({
        select: ticketSelect,
        orderBy: { updatedAt: "desc" },
        take: 100,
      });

      return NextResponse.json(tickets);
    }

    const accountHash = hashSupportAccount(auth.id);

    const tickets = await prisma.supportTicket.findMany({
      where: { accessKeyHash: accountHash },
      select: ticketSelect,
      orderBy: { updatedAt: "desc" },
      take: 25,
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Support inbox error:", error);
    return NextResponse.json(
      { error: "Could not load support inbox." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Please log in or create an account before contacting support." },
        { status: 401 }
      );
    }

    if (isStaffAccount(auth)) {
      return NextResponse.json(
        { error: "Staff accounts should use the staff Support Inbox." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found. Please log in again." },
        { status: 401 }
      );
    }

    const ip = getClientIp(request);
    const visitorHash = hashVisitor(ip);

    const blocked = await prisma.blockedVisitor.findUnique({
      where: { hash: visitorHash },
    });

    if (blocked) {
      return NextResponse.json(
        { error: "Support requests are unavailable from this connection." },
        { status: 403 }
      );
    }

    const accountHash = hashSupportAccount(auth.id);

    const recent = await prisma.supportTicket.count({
      where: {
        accessKeyHash: accountHash,
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
    });

    if (recent >= 4) {
      return NextResponse.json(
        { error: "Too many support requests. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const phone = cleanText(body.phone, 40);
    const preference = cleanText(body.contactPreference || "website", 20);
    const subject = cleanText(body.subject, 120);
    const message = cleanText(body.message, 1500);

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Topic and message are required." },
        { status: 400 }
      );
    }

    if ((preference === "phone" || preference === "text") && !phone) {
      return NextResponse.json(
        { error: "Add a phone number so the team can reach you." },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        // Account-bound hash: only this signed-in account (or the owner) can read it.
        accessKeyHash: accountHash,
        visitorHash,
        name: user.name,
        email: user.email,
        phone: phone || null,
        contactPreference: preference,
        subject,
        messages: {
          create: {
            sender: "visitor",
            body: message,
          },
        },
      },
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    });

    await notifyDiscord({
      id: ticket.id,
      accountId: user.id,
      name: user.name,
      email: user.email,
      phone,
      preference,
      subject,
      message,
      ip,
      visitorHash,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("Support request error:", error);
    return NextResponse.json(
      { error: "Could not send the support request." },
      { status: 500 }
    );
  }
}
