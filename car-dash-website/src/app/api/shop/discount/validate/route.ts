import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DISCOUNT_CODES_KEY, parseDiscountCodes } from "@/lib/booking-pricing";
import { readShop } from "@/lib/shop";
import { evaluateShopDiscount } from "@/lib/shop-discounts";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const code = String(payload?.code || "");
    const variantId = String(payload?.variant || "");
    const email = String(payload?.email || "");
    const shop = await readShop();
    const variant = shop.variants.find((item) => item.published && item.id === variantId);
    if (!variant) return NextResponse.json({ valid: false, message: "That product is no longer available." }, { status: 404 });

    const saved = await prisma.siteContent.findUnique({ where: { key: DISCOUNT_CODES_KEY } });
    const result = evaluateShopDiscount({
      codes: parseDiscountCodes(saved?.value),
      orders: shop.orders,
      code,
      priceCents: variant.cents,
      email,
    });
    if (!result.ok) return NextResponse.json({ valid: false, message: result.message }, { status: 409 });
    return NextResponse.json({
      valid: true,
      code: result.code,
      label: result.label,
      savedCents: result.savedCents,
      totalCents: result.totalCents,
    });
  } catch (error) {
    console.error("Merch discount validation failed:", error);
    return NextResponse.json({ valid: false, message: "Could not check this code. Please try again." }, { status: 500 });
  }
}
