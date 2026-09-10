import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { getVisitorHash, getVisitorIp, isVisitorBlocked } from "@/lib/visitor-security";
import { sendDiscordEmbed } from "@/lib/discord";

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function getAllowedTicket(request: NextRequest, id: string) {
  const auth = getAuthFromRequest(request);
  const accessToken = request.nextUrl.searchParams.get("accessToken") || "";
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!ticket) return null;
  if (auth?.role === "owner") return ticket;
  if (auth && ticket.userId === auth.id) return ticket;
  if (accessToken && ticket.accessTokenHash === hashToken(accessToken)) return ticket;
  return null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const ticket = await getAllowedTicket(request, id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });

  return NextResponse.json({
    ticket: {
      id: ticket.id,
      name: ticket.name,
      email: ticket.email,
      phone: ticket.phone,
      contactPreference: ticket.contactPreference,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      messages: ticket.messages,
    },
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const ticket = await getAllowedTicket(request, id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });

    const auth = getAuthFromRequest(request);
    const sender = auth?.role === "owner" ? "owner" : "customer";

    if (sender === "customer") {
      const visitorHash = getVisitorHash(request);
      if (await isVisitorBlocked(visitorHash)) {
        return NextResponse.json({ error: "Messaging from this connection is blocked." }, { status: 403 });
      }

      const recent = await prisma.supportMessage.count({
        where: {
          ticketId: id,
          sender: "customer",
          createdAt: { gte: new Date(Date.now() - 60 * 1000) },
        },
      });
      if (recent >= 8) {
        return NextResponse.json({ error: "Too many messages. Please wait a minute." }, { status: 429 });
      }
    }

    const body = String((await request.json()).message || "").trim().slice(0, 2000);
    if (!body) return NextResponse.json({ error: "Message is required." }, { status: 400 });

    const message = await prisma.supportMessage.create({
      data: { ticketId: id, sender, body },
    });

    await prisma.supportTicket.update({
      where: { id },
      data: { status: sender === "owner" ? "waiting" : "open" },
    });

    if (sender === "customer") {
      const visitorHash = getVisitorHash(request);
      await sendDiscordEmbed({
        webhookUrl: process.env.DISCORD_SUPPORT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL,
        title: "Support ticket reply",
        description: `${ticket.name} sent another website support message.`,
        fields: [
          { name: "Ticket", value: ticket.id, inline: false },
          { name: "Subject", value: ticket.subject, inline: false },
          { name: "Message", value: body, inline: false },
          { name: "IP", value: getVisitorIp(request), inline: false },
          { name: "Visitor hash", value: visitorHash, inline: false },
        ],
        footer: "IP/hash are only sent to Discord and are not displayed in the website dashboard.",
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Support message error:", error);
    return NextResponse.json({ error: "Could not send message." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = getAuthFromRequest(request);
  if (!auth || auth.role !== "owner") {
    return NextResponse.json({ error: "Owner login required." }, { status: 403 });
  }

  const { id } = await context.params;
  const status = String((await request.json()).status || "").trim();
  if (!["open", "waiting", "closed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.update({ where: { id }, data: { status } });
  return NextResponse.json({ ticket });
}
