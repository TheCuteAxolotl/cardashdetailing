import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeBookingReference } from "@/lib/booking-reference";
import { certificateDetails } from "@/lib/service-certificate";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  try {
    const body = await request.json();
    const number = normalizeBookingReference(String(body.number || ""));
    if (!/^CD-[A-Z0-9-]{4,76}$/.test(number)) return NextResponse.json({ error: "Enter the booking / invoice number printed on your certificate." }, { status: 400, headers });
    const reference = await prisma.siteContent.findUnique({ where: { key: `booking-lookup:${number}` } });
    const booking = reference ? await prisma.booking.findUnique({ where: { id: reference.value } }) : null;
    if (!booking || booking.status !== "completed") return NextResponse.json({ error: "No completed service found for that number. Check the number or contact Car Dash Detailing." }, { status: 404, headers });
    // Explicit allowlist: no customer name, address, contact info, notes, payment data or invoice access tokens.
    return NextResponse.json(certificateDetails(booking, number), { headers });
  } catch {
    return NextResponse.json({ error: "Could not look up the service. Please try again." }, { status: 500, headers });
  }
}
