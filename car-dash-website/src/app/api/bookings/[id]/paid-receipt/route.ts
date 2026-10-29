import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBookingConversation } from "@/lib/booking-chat";
import { sendCustomerSmsWithHistory } from "@/lib/customer-sms-history";
import { calculateInvoiceTotals, getInvoice, nextInvoiceNumber, requireOwner, sanitizeInvoiceInput, saveInvoice } from "@/lib/invoices";
import { getPublicSiteUrl, normalizePhoneNumber } from "@/lib/twilio-sms";
import { invoiceSmsText, isInvoiceFullyPaid, paidReceiptInvoiceId } from "@/lib/paid-receipt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function payloadForInvoice(invoice: NonNullable<Awaited<ReturnType<typeof getInvoice>>>) {
  return {
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      sentAt: invoice.sentAt,
      totals: calculateInvoiceTotals(invoice),
    },
    link: `${getPublicSiteUrl()}/invoice/${invoice.shareToken}`,
  };
}

function uniqueConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

export async function GET(_request: Request, context: Context) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const { id } = await context.params;
  const invoice = await getInvoice(paidReceiptInvoiceId(id));
  return NextResponse.json(invoice ? payloadForInvoice(invoice) : { invoice: null }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

/** Creates one paid invoice for a booked job and sends a one-time SMS receipt. */
export async function POST(request: Request, context: Context) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if ((origin && origin !== url.origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (!["confirmed", "completed"].includes(booking.status)) {
      return NextResponse.json({ error: "Only confirmed or completed appointments can be receipted." }, { status: 409 });
    }
    if (!normalizePhoneNumber(booking.customerPhone)) {
      return NextResponse.json({ error: "Add a valid customer phone number to this booking first." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.paymentReceived !== true) {
      return NextResponse.json({ error: "Confirm that the payment was actually received." }, { status: 400 });
    }
    if (body?.smsConsentConfirmed !== true) {
      return NextResponse.json({ error: "Confirm the customer agreed to receive a receipt by text." }, { status: 400 });
    }

    const identifier = paidReceiptInvoiceId(id);
    let invoice = await getInvoice(identifier);
    if (!invoice) {
      const amount = Number(body?.amount);
      const method = String(body?.method || "").trim();
      const allowedMethods = ["Cash", "Check", "Card (outside website)", "Zelle", "Venmo", "ACH / Bank", "Other"];
      const reference = String(body?.reference || "").trim().slice(0, 120);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100000 || Math.abs(Math.round(amount * 100) - amount * 100) > 0.000001) {
        return NextResponse.json({ error: "Enter the exact amount received in dollars and cents." }, { status: 400 });
      }
      if (!allowedMethods.includes(method)) {
        return NextResponse.json({ error: "Choose a payment method." }, { status: 400 });
      }

      const vehicle = [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel, booking.vehicleTrim]
        .filter((part) => part && !/^not specified$/i.test(part)).join(" ");
      const newInvoice = sanitizeInvoiceInput({
        id: identifier,
        invoiceNumber: await nextInvoiceNumber(),
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        assetType: "Vehicle",
        assetDescription: vehicle,
        serviceDate: booking.preferredDate || new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()),
        dueDate: "",
        lineItems: [{ id: "detail-service", description: booking.serviceName, quantity: 1, rate: amount }],
        discountAmount: 0,
        taxRate: 0,
        notes: "Thank you for choosing Car Dash Detailing.",
        internalInspectionNotes: `Owner confirmed offline payment received and customer SMS receipt permission on ${new Date().toISOString()}. This records an owner-reported payment, not an independently verified bank transaction.`,
        terms: "Payment received in full.",
        paymentOptions: { check: false, cash: false, online: false, other: false },
        payments: [{ id: `booking-payment-${id}`, amount, method, reference: reference || undefined, paidAt: new Date().toISOString() }],
        status: "paid",
        source: `booking-paid:${id}`,
      });
      // Atomic uniqueness: the same booking can't generate two paid invoices
      // when an owner taps twice or multiple requests arrive concurrently.
      try {
        await prisma.siteContent.create({
          data: { key: `invoice:${identifier}`, value: JSON.stringify(newInvoice) },
        });
        invoice = newInvoice;
      } catch (error) {
        if (!uniqueConflict(error)) throw error;
        invoice = await getInvoice(identifier);
      }
    }

    if (!invoice) return NextResponse.json({ error: "Could not load the receipt" }, { status: 500 });
    if (!isInvoiceFullyPaid(invoice)) {
      return NextResponse.json({ error: "The saved invoice is not fully paid. Review it before sending a paid receipt." }, { status: 409 });
    }
    const result = payloadForInvoice(invoice);
    if (invoice.sentAt) return NextResponse.json({ ...result, alreadySent: true });

    // A unique SMS claim prevents concurrent requests from sending twice.
    const smsKey = `paid-receipt-sms:${identifier}`;
    try {
      await prisma.siteContent.create({ data: { key: smsKey, value: "claimed" } });
    } catch (error) {
      if (uniqueConflict(error)) return NextResponse.json({ ...result, sending: true }, { status: 202 });
      throw error;
    }

    let sent = false;
    try {
      const latest = await getInvoice(identifier);
      if (!latest || !isInvoiceFullyPaid(latest) || latest.sentAt) {
        await prisma.siteContent.delete({ where: { key: smsKey } });
        return NextResponse.json({ error: "Invoice changed. Refresh it before sending." }, { status: 409 });
      }
      const text = invoiceSmsText(latest, result.link);
      const delivery = await sendCustomerSmsWithHistory({ to: latest.customerPhone, body: text });
      if (!delivery.sent || !delivery.sid) {
        await prisma.siteContent.delete({ where: { key: smsKey } });
        return NextResponse.json({
          error: "Paid invoice was saved, but the receipt SMS could not be sent. Open Invoices to retry.",
          ...result,
        }, { status: 502 });
      }
      sent = true;

      // Twilio accepted the message. Keep the claim even if the receipt log
      // cannot be written, to prevent accidentally texting customers twice.
      try {
        await prisma.siteContent.update({ where: { key: smsKey }, data: { value: delivery.sid } });
        invoice = await saveInvoice({ ...latest, sentAt: latest.sentAt || new Date().toISOString() });
        const conversation = await ensureBookingConversation(id);
        await prisma.bookingMessage.upsert({
          where: { externalSid: delivery.sid },
          update: {},
          create: {
            conversationId: conversation.id,
            sender: "team",
            body: `${text}\nReply STOP to opt out or HELP for help.`,
            channel: "sms",
            externalSid: delivery.sid,
          },
        });
        await prisma.bookingConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
      } catch (error) {
        console.error("Paid receipt sent but conversation logging failed:", error);
      }
      return NextResponse.json({ ...payloadForInvoice(invoice), smsSent: true });
    } catch (error) {
      if (!sent) {
        await prisma.siteContent.delete({ where: { key: smsKey } }).catch(() => null);
      }
      throw error;
    }
  } catch (error) {
    console.error("Booking paid receipt error:", error);
    return NextResponse.json({ error: "Could not create or text the paid receipt. Check invoices before trying again." }, { status: 500 });
  }
}
