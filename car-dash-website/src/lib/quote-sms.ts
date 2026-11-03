import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/twilio-sms";

/** Never send an old quote's details to a phone after that number was
 * disconnected, even if the original quote included SMS consent. */
async function safeQuotePhone(threadId: string, rawPhone: string | null) {
  const phone = normalizePhoneNumber(rawPhone);
  if (!phone) return null;
  const [thread, release] = await Promise.all([
    prisma.quoteThread.findUnique({ where: { id: threadId }, select: { createdAt: true } }),
    prisma.siteContent.findUnique({ where: { key: "phone_released_at_" + phone }, select: { value: true } }),
  ]);
  if (!thread) return null;
  const releaseMs = Number(release?.value || 0);
  if (Number.isFinite(releaseMs) && releaseMs > 0 && thread.createdAt.getTime() <= releaseMs) return null;
  return phone;
}
export async function getQuoteSmsContact(threadId: string) {
  const systemMessage = await prisma.quoteMessage.findFirst({
    where: {
      threadId,
      sender: "system",
      body: { startsWith: "SMS contact:" },
    },
    orderBy: { createdAt: "asc" },
    select: { body: true },
  });

  if (!systemMessage) {
    const thread = await prisma.quoteThread.findUnique({
      where: { id: threadId },
      select: { guestPhone: true, userId: true },
    });
    if (thread?.guestPhone && thread.userId) {
      const number = normalizePhoneNumber(thread.guestPhone);
      if (!number) return { phone: null, consent: false };
      const owner = await prisma.siteContent.findUnique({ where: { key: "verified_phone_" + number } });
      if (owner?.value === thread.userId) {
        const safe = await safeQuotePhone(threadId, number);
        if (safe) return { phone: safe, consent: true };
      }
    }
    return { phone: null, consent: false };
  }

  const match = systemMessage.body.match(/^SMS contact:\s*(.*?)\s*·\s*consent:\s*(Yes|No)$/i);
  if (!match) return { phone: null, consent: false };
  const raw = match[1].trim();
  if (!raw || raw.toLowerCase() === "not provided") return { phone: null, consent: false };
  const phone = await safeQuotePhone(threadId, raw);
  return { phone, consent: Boolean(phone) && match[2].toLowerCase() === "yes" };
}
