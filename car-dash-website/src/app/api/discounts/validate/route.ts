import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DISCOUNT_CODES_KEY, normalizeDiscountCode, parseDiscountCodes } from "@/lib/booking-pricing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = normalizeDiscountCode(String(body?.code || ""));
    if (!code) return NextResponse.json({ valid: false, message: "Enter a discount code." }, { status: 400 });

    const row = await prisma.siteContent.findUnique({ where: { key: DISCOUNT_CODES_KEY } });
    const discount = parseDiscountCodes(row?.value).find((item) => item.active && item.code === code);
    if (!discount) return NextResponse.json({ valid: false, message: "That discount code is not valid." }, { status: 404 });

    return NextResponse.json({
      valid: true,
      discount: { code: discount.code, label: discount.label, type: discount.type, amount: discount.amount },
    });
  } catch (error) {
    console.error("Discount validation failed:", error);
    return NextResponse.json({ valid: false, message: "Could not validate that code." }, { status: 500 });
  }
}
