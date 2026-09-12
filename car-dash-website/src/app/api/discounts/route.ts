import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import { DISCOUNT_CODES_KEY, DiscountCode, normalizeDiscountCode, parseDiscountCodes } from "@/lib/booking-pricing";

function sanitizeDiscounts(value: unknown): DiscountCode[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any, index) => {
      const type: "percent" | "fixed" = item?.type === "fixed" ? "fixed" : "percent";
      const rawAmount = Number(item?.amount || 0);
      const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? (type === "percent" ? Math.min(rawAmount, 100) : rawAmount) : 0;
      return {
        id: String(item?.id || `discount-${index + 1}`).slice(0, 80),
        code: normalizeDiscountCode(String(item?.code || "")),
        label: String(item?.label || "").trim().slice(0, 120),
        type,
        amount,
        active: item?.active !== false,
      };
    })
    .filter((item) => item.code && item.amount > 0)
    .filter((item, index, all) => all.findIndex((other) => other.code === item.code) === index)
    .slice(0, 100);
}

export async function GET(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) return NextResponse.json({ error: "Owner login required" }, { status: 403 });
  const row = await prisma.siteContent.findUnique({ where: { key: DISCOUNT_CODES_KEY } });
  return NextResponse.json({ discounts: parseDiscountCodes(row?.value) });
}

export async function PUT(request: NextRequest) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(auth)) return NextResponse.json({ error: "Owner login required" }, { status: 403 });
  try {
    const body = await request.json();
    const discounts = sanitizeDiscounts(body?.discounts);
    await prisma.siteContent.upsert({
      where: { key: DISCOUNT_CODES_KEY },
      update: { value: JSON.stringify(discounts) },
      create: { key: DISCOUNT_CODES_KEY, value: JSON.stringify(discounts) },
    });
    return NextResponse.json({ discounts });
  } catch (error) {
    console.error("Failed to save discount codes:", error);
    return NextResponse.json({ error: "Could not save discount codes" }, { status: 500 });
  }
}
