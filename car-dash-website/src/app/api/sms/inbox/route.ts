import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBookingChatSchema } from "@/lib/booking-chat";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!hasStaffPermission(auth, "smsInbox")) {
      return NextResponse.json({ error: "Staff access required." }, { status: 403 });
    }

    await ensureBookingChatSchema();

    const conversations = await prisma.bookingConversation.findMany({
      where: {
        messages: {
          some: {
            sender: { in: ["customer", "team"] },
          },
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            serviceName: true,
            vehicleYear: true,
            vehicleMake: true,
            vehicleModel: true,
            vehicleTrim: true,
            status: true,
            preferredDate: true,
            preferredTime: true,
          },
        },
        messages: {
          where: { sender: { in: ["customer", "team"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const rows = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await prisma.bookingMessage.count({
          where: {
            conversationId: conversation.id,
            sender: "customer",
            ...(conversation.lastStaffSeenAt
              ? { createdAt: { gt: conversation.lastStaffSeenAt } }
              : {}),
          },
        });

        const latest = conversation.messages[0] || null;
        return {
          conversationId: conversation.id,
          booking: conversation.booking,
          latestMessage: latest,
          unreadCount,
          updatedAt: conversation.updatedAt,
        };
      })
    );

    const unmatched = await prisma.unmatchedSmsMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      conversations: rows,
      unmatched,
      totalUnread: rows.reduce((sum, row) => sum + row.unreadCount, 0),
    });
  } catch (error) {
    console.error("SMS inbox load failed:", error);
    return NextResponse.json({ error: "Could not load SMS inbox." }, { status: 500 });
  }
}
