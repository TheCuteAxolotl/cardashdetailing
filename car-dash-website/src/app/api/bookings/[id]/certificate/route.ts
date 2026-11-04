import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";
import { ensureBookingReference } from "@/lib/booking-reference";
import { certificateDetails, escapeCertificateHtml as escape } from "@/lib/service-certificate";
import { getPublicSiteUrl } from "@/lib/twilio-sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!hasStaffPermission(await getCurrentAccountFromRequest(request), "bookings")) {
      return new NextResponse("Sign in with booking access to print certificates.", { status: 403 });
    }
    const { id } = await context.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return new NextResponse("Booking not found.", { status: 404 });
    if (booking.status !== "completed") return new NextResponse("Mark this booking completed before printing its service certificate.", { status: 409 });
    if (!booking.preferredDate) return new NextResponse("Add the actual service date to the booking before printing.", { status: 409 });
    const number = await ensureBookingReference(id);
    const details = certificateDetails(booking, number);
    const lookupUrl = `${getPublicSiteUrl()}/service-lookup`;
    const qr = await QRCode.toString(lookupUrl, { type: "svg", errorCorrectionLevel: "M", margin: 4, width: 150 });
    return new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Car Dash Certificate ${escape(number)}</title><style>
      *{box-sizing:border-box}body{margin:0;background:#ece9e2;color:#24211c;font:15px Arial,sans-serif}.toolbar{max-width:820px;margin:24px auto;padding:0 20px;display:flex;align-items:center;gap:20px}button{background:#24211c;color:white;padding:14px 24px;border:0;border-radius:8px;cursor:pointer}.sheet{max-width:820px;min-height:1000px;margin:20px auto;padding:60px;background:white;border-top:9px solid #b18b38}.brand{font-weight:900;font-style:italic;font-size:30px;letter-spacing:2px;color:#a17c2e}.eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:3px}header{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #b7a77d;padding-bottom:25px}.reference{text-align:right;font-size:11px;overflow-wrap:anywhere;max-width:250px}h1{font:44px Georgia,serif;letter-spacing:3px;text-align:center;margin:65px 0 10px}.subtitle{text-align:center;color:#7d632d;letter-spacing:4px;font-size:12px}.intro{text-align:center;line-height:1.8;margin:40px 0 25px}h2{text-align:center;font:26px Georgia,serif}.client{text-align:center;color:#615a4d}.services{margin:40px 0;border-top:1px solid #b7a77d}.services p{padding:15px 0;border-bottom:1px solid #e8e3d8;line-height:1.6}.date{margin:30px 0}.date strong{display:block;margin-top:10px}.bottom{margin-top:65px;display:flex;align-items:center;justify-content:space-between;gap:25px}.signature{font:italic 27px Georgia,serif;color:#7d632d}.verify{text-align:center;font-size:11px;max-width:240px;overflow-wrap:anywhere}.verify svg{display:block;margin:auto}footer{border-top:1px solid #b7a77d;margin-top:40px;padding-top:20px;font-size:11px;line-height:1.8;color:#615a4d}@page{size:letter;margin:12mm}@media print{body{background:white}.toolbar{display:none}.sheet{margin:0;padding:25px;min-height:0;max-width:none;break-inside:avoid}h1{margin-top:40px}.bottom{margin-top:40px}}@media(max-width:600px){.sheet{padding:25px}h1{font-size:30px}header,.bottom{flex-wrap:wrap}.reference{text-align:left}}
      </style></head><body><div class="toolbar"><button onclick="window.print()">Print / Save PDF</button><span>Use your browser’s print dialog to print or save a PDF.</span></div><main class="sheet"><header><div><div class="brand">CAR DASH</div><div class="eyebrow">Detailing</div></div><div class="reference">BOOKING / INVOICE NUMBER<br><br><strong>${escape(number)}</strong></div></header><h1>CERTIFICATE</h1><div class="subtitle">SERVICE COMPLETION</div><p class="intro">This certifies that Car Dash Detailing completed the following<br>services on the vehicle listed below.</p><h2>${escape(details.vehicle || "Customer vehicle")}</h2><p class="client">Client: ${escape(booking.customerName)}</p><section class="services"><p class="eyebrow">Services performed</p>${details.services.map(service => `<p>${escape(service)}</p>`).join("")}</section><div class="date"><span class="eyebrow">Service date</span><strong>${escape(booking.preferredDate)}</strong></div><div class="bottom"><div><p class="eyebrow">Issued by</p><p class="signature">Car Dash Detailing</p><p>South Elgin, Illinois</p></div><div class="verify">${qr}<strong>Verify your service online</strong><p>Scan, then enter your booking / invoice number.</p><p>${escape(lookupUrl)}</p></div></div><footer>224-344-3451 · cardashdetailing.com<br>We’re not satisfied until YOU’RE satisfied!<br>This records service completion. Payment status and any separately agreed warranty terms are shown in your invoice or service agreement.</footer></main></body></html>`, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" },
    });
  } catch (error) {
    console.error("Certificate error:", error);
    return new NextResponse("Could not prepare the certificate. Please retry or check the booking's invoice number.", { status: 500 });
  }
}
