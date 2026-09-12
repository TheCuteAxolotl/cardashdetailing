import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isOwnerAccount, hasStaffPermission } from "@/lib/permissions";
import { cleanText, hashSupportAccount } from "@/lib/support-security";

async function canAccess(request: NextRequest, id: string) {
  const auth = await getCurrentAccountFromRequest(request);

  if (!auth) return null;
  if (hasStaffPermission(auth, "support")) return { staff: true, auth };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { accessKeyHash: true },
  });

  if (!ticket) return null;

  const accountHash = hashSupportAccount(auth.id);

  if (ticket.accessKeyHash !== accountHash) {
    return null;
  }

  return { staff: false, auth };
}

async function notifyDiscordReply(data: {
  ticketId: string;
  message: string;
  email: string;
}) {
  const url = (
    process.env.DISCORD_SUPPORT_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL
  )?.trim();

  if (!url) return;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Car Dash Support",
        content: [
          "**New customer support reply**",
          `Ticket: ${data.ticketId}`,
          `Account email: ${data.email}`,
          `Message: ${data.message}`,
          "Owner support: https://cardashdetailing.com/owner/support",
        ]
          .join("\n")
          .slice(0, 1950),
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.error(
        `Support reply Discord notification failed with ${response.status}: ${details.slice(0, 300)}`
      );
    }
  } catch (error) {
    console.error("Support reply Discord notification failed:", error);
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const access = await canAccess(request, id);

  if (!access) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
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
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, sender: true, body: true, createdAt: true },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json(ticket);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const access = await canAccess(request, id);

  if (!access) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { message } = await request.json();
  const body = cleanText(message, 1500);

  if (!body) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  if (!access.staff) {
    const recent = await prisma.supportMessage.count({
      where: {
        ticketId: id,
        sender: "visitor",
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    if (recent >= 20) {
      return NextResponse.json(
        { error: "Too many messages. Try again in a few minutes." },
        { status: 429 }
      );
    }
  }

  const created = await prisma.supportMessage.create({
    data: {
      ticketId: id,
      sender: access.staff ? "team" : "visitor",
      body,
    },
  });

  await prisma.supportTicket.update({
    where: { id },
    data: { status: "open" },
  });

  if (!access.staff) {
    await notifyDiscordReply({
      ticketId: id,
      message: body,
      email: access.auth.email,
    });
  }

  return NextResponse.json(created, { status: 201 });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentAccountFromRequest(request);

  if (!hasStaffPermission(auth, "support")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id } = await context.params;
  const { status } = await request.json();
  const allowed = ["open", "waiting", "closed"];

  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  });

  return NextResponse.json(ticket);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAccountFromRequest(request);

    if (!isOwnerAccount(auth)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id } = await context.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.status !== "closed") {
      return NextResponse.json(
        { error: "Only closed support chats can be deleted." },
        { status: 400 }
      );
    }

    await prisma.supportTicket.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Closed support chat deleted successfully.",
    });
  } catch (error) {
    console.error("Delete support ticket error:", error);
    return NextResponse.json(
      { error: "Could not delete support chat." },
      { status: 500 }
    );
  }
}

