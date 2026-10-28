import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Share conversion's lock, then compare the snapshot before changing quote state.
// A stale quote action must never reopen a converted quote or accept a revised price.
export async function updateQuoteState(
  id: string,
  expectedUpdatedAt: Date,
  data: Prisma.QuoteThreadUncheckedUpdateInput,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"quote-booking:" + id}))::text`;
    const current = await tx.quoteThread.findUnique({ where: { id } });
    if (!current || current.status === "booked" || current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) return null;
    return tx.quoteThread.update({ where: { id }, data });
  });
}
