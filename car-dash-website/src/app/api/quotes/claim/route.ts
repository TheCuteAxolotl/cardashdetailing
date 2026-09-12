import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isStaffAccount } from "@/lib/permissions";
import { ensureGuestQuoteSupport, normalizeEmail } from "@/lib/quote-guest";

export async function POST(request: NextRequest) {
  await ensureGuestQuoteSupport();
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth || isStaffAccount(auth)) {
    return NextResponse.json({ error: "Customer login required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const quoteId = String(body.quoteId || "").trim();
  if (!quoteId) return NextResponse.json({ error: "Quote reference required." }, { status: 400 });

  const quote = await prisma.quoteThread.findUnique({
    where: { id: quoteId },
    select: { id: true, userId: true, guestEmail: true },
  });
  if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  if (quote.userId === auth.id) return NextResponse.json({ success: true, alreadyLinked: true });
  if (quote.userId) return NextResponse.json({ error: "That quote is already linked to another account." }, { status: 409 });
  if (!quote.guestEmail || normalizeEmail(quote.guestEmail) !== normalizeEmail(auth.email)) {
    return NextResponse.json({ error: "Sign in with the same email used for the quote request." }, { status: 403 });
  }

  await prisma.quoteThread.update({
    where: { id: quote.id },
    data: { userId: auth.id, lastCustomerSeenAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
