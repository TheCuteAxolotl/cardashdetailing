import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { getVisitorHash, getVisitorIp, isVisitorBlocked } from "@/lib/visitor-security";
import { sendDiscordEmbed } from "@/lib/discord";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function text(value: unknown, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ tickets: [] });

  const tickets = await prisma.supportTicket.findMany({
    where: auth.role === "owner" ? {} : { userId: auth.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      contactPreference: true,
      subject: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ tickets });
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const ip = getVisitorIp(request);
    const visitorHash = getVisitorHash(request);

    if (await isVisitorBlocked(visitorHash)) {
      return NextResponse.json(
        { error: "Support requests from this connection are currently blocked." },
        { status: 403 }
      );
    }

    const recentCount = await prisma.supportTicket.count({
      where: {
        visitorHash,
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
    });

    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Too many support requests. Please wait a bit before sending another." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const name = text(body.name, 120) || "Website visitor";
    const email = text(body.email, 180);
    const phone = text(body.phone, 60);
    const contactPreference = text(body.contactPreference, 30) || "website";
    const subject = text(body.subject, 160);
    const message = text(body.message, 2000);

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }

    if (contactPreference === "email" && !email) {
      return NextResponse.json({ error: "Add an email so the team can reach out." }, { status: 400 });
    }

    if (contactPreference === "phone" && !phone) {
      return NextResponse.json({ error: "Add a phone number so the team can reach out." }, { status: 400 });
    }

    const accessToken = randomBytes(24).toString("hex");
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: auth?.id ?? null,
        name,
        email: email || null,
        phone: phone || null,
        contactPreference,
        subject,
        visitorHash,
        accessTokenHash: tokenHash(accessToken),
        messages: {
          create: { sender: "customer", body: message },
        },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    await sendDiscordEmbed({
      webhookUrl: process.env.DISCORD_SUPPORT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL,
      title: "New website support request",
      description: `${name} opened a support ticket from cardashdetailing.com.`,
      fields: [
        { name: "Ticket", value: ticket.id, inline: false },
        { name: "Subject", value: subject, inline: false },
        { name: "Message", value: message, inline: false },
        { name: "Preferred contact", value: contactPreference, inline: true },
        { name: "Email", value: email || "Not provided", inline: true },
        { name: "Phone", value: phone || "Not provided", inline: true },
        { name: "IP", value: ip, inline: false },
        { name: "Visitor hash", value: visitorHash, inline: false },
      ],
      footer: "IP and visitor hash are sent to Discord for anti-spam review and are not shown in the website dashboard.",
    });

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        messages: ticket.messages,
      },
      accessToken,
    }, { status: 201 });
  } catch (error) {
    console.error("Support request error:", error);
    return NextResponse.json({ error: "Could not send the support request." }, { status: 500 });
  }
}
