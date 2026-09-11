import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getPublicSiteUrl } from "@/lib/twilio-sms";

let schemaReady: Promise<void> | null = null;

/**
 * V3.2 adds booking chat without putting prisma db push back into every Vercel build.
 * The tables are additive-only and are created lazily the first time booking chat is used.
 */
export function ensureBookingChatSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BookingConversation" (
          "id" TEXT NOT NULL,
          "bookingId" TEXT NOT NULL,
          "lastCustomerSeenAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "BookingConversation_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "BookingConversation_bookingId_fkey"
            FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
            ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "BookingConversation_bookingId_key"
        ON "BookingConversation"("bookingId")
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BookingMessage" (
          "id" TEXT NOT NULL,
          "conversationId" TEXT NOT NULL,
          "sender" TEXT NOT NULL,
          "body" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BookingMessage_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "BookingMessage_conversationId_fkey"
            FOREIGN KEY ("conversationId") REFERENCES "BookingConversation"("id")
            ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "BookingMessage_conversationId_createdAt_idx"
        ON "BookingMessage"("conversationId", "createdAt")
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}

function bookingChatSecret() {
  return (process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "").trim();
}

export function createBookingChatKey(bookingId: string, customerEmail: string) {
  const secret = bookingChatSecret();
  if (!secret) return null;

  return createHmac("sha256", secret)
    .update(`booking-chat:${bookingId}:${customerEmail.trim().toLowerCase()}`)
    .digest("base64url");
}

export function verifyBookingChatKey(
  bookingId: string,
  customerEmail: string,
  candidate: string | null | undefined
) {
  const expected = createBookingChatKey(bookingId, customerEmail);
  if (!expected || !candidate) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(candidate.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

export function getBookingChatUrl(
  bookingId: string,
  customerEmail: string,
  requireAccountLogin = false
) {
  const base = `${getPublicSiteUrl()}/booking-chat/${encodeURIComponent(bookingId)}`;
  if (requireAccountLogin) return base;

  const key = createBookingChatKey(bookingId, customerEmail);
  return key ? `${base}?key=${encodeURIComponent(key)}` : base;
}

export function bookingHasSmsConsent(notes: string | null | undefined) {
  return /(?:^|\n)SMS consent:\s*Yes(?:\n|$)/i.test(notes || "");
}

export async function ensureBookingConversation(bookingId: string) {
  await ensureBookingChatSchema();

  return prisma.bookingConversation.upsert({
    where: { bookingId },
    update: {},
    create: { bookingId },
  });
}

export async function addBookingSystemMessage(bookingId: string, body: string) {
  const conversation = await ensureBookingConversation(bookingId);
  return prisma.bookingMessage.create({
    data: {
      conversationId: conversation.id,
      sender: "system",
      body: body.slice(0, 3000),
    },
  });
}

export async function notifyBookingChatDiscord(input: {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  vehicle: string;
  message: string;
}) {
  const url = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!url) return;

  const ownerUrl = `${getPublicSiteUrl()}/booking-chat/${encodeURIComponent(input.bookingId)}`;
  const lines = [
    "**New booking chat message**",
    `Customer: ${input.customerName}`,
    `Email: ${input.customerEmail}`,
    `Service: ${input.serviceName}`,
    `Vehicle: ${input.vehicle || "Not specified"}`,
    `Message: ${input.message}`,
    `Open chat: ${ownerUrl}`,
  ].join("\n");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: lines.slice(0, 1950),
        username: "Car Dash Detailing",
      }),
    });

    if (!response.ok) {
      console.error("Discord booking-chat notification failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("Discord booking-chat notification failed:", error);
  }
}
