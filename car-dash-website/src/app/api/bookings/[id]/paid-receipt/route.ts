import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBookingConversation } from "@/lib/booking-chat";
import { sendCustomerSmsWithHistory } from "@/lib/customer-sms-history";
import { calculateInvoiceTotals, getInvoice, nextInvoiceNumber, requireOwner, sanitizeInvoiceInput, saveInvoice } from "@/lib/invoices";
import type { InvoicePayment, InvoiceRecord } from "@/lib/invoices";
import { getPublicSiteUrl, normalizePhoneNumber } from "@/lib/twilio-sms";
import { paidReceiptInvoiceId, paymentReceiptSmsText } from "@/lib/paid-receipt";

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
      dueDate: invoice.dueDate,
      payments: invoice.payments,
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

/** Record a payment against one booking invoice, then acknowledge that payment by SMS. */
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
      return NextResponse.json({ error: "Only confirmed or completed appointments can have receipts." }, { status: 409 });
    }
    if (!normalizePhoneNumber(booking.customerPhone)) {
      return NextResponse.json({ error: "Add a valid customer phone number first." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.paymentReceived !== true) {
      return NextResponse.json({ error: "Confirm that this payment was actually received." }, { status: 400 });
    }
    if (body?.smsConsentConfirmed !== true) {
      return NextResponse.json({ error: "Confirm that the customer agreed to receive a text." }, { status: 400 });
    }

    // The client keeps this ID unchanged if saving succeeds but sending fails.
    const requestId = String(body?.paymentId || "").trim();
    if (!/^[a-zA-Z0-9-]{8,80}$/.test(requestId)) {
      return NextResponse.json({ error: "Invalid payment request. Refresh and try again." }, { status: 400 });
    }
    const paymentId = \`receipt-payment-\${requestId}\`;
    const identifier = paidReceiptInvoiceId(id);
    const amount = Number(body?.paidAmount);
    const totalAmount = Number(body?.totalAmount);
    const method = String(body?.method || "").trim();
    const allowedMethods = ["Cash", "Check", "Card (outside website)", "Zelle", "Venmo", "ACH / Bank", "Other"];
    const reference = String(body?.reference || "").trim().slice(0, 120);
    const dueDate = String(body?.dueDate || "").trim();
    const cents = (value: number) =>
      Number.isFinite(value) && value > 0 && value <= 100000
      && Math.abs(Math.round(value * 100) - value * 100) < 0.000001;
    if (!cents(amount)) {
      return NextResponse.json({ error: "Enter the payment actually received in dollars and cents." }, { status: 400 });
    }
    if (!allowedMethods.includes(method)) {
      return NextResponse.json({ error: "Choose a payment method." }, { status: 400 });
    }
    if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(new Date(\`\${dueDate}T12:00:00\`).getTime()))) {
      return NextResponse.json({ error: "Enter a valid balance due date." }, { status: 400 });
    }

    let invoice: InvoiceRecord | null = null;
    const key = \`invoice:\${identifier}\`;

    // Compare-and-swap avoids lost updates or double charges in owner records
    // when two browser tabs record a payment at nearly the same time.
    for (let attempt = 0; attempt < 5; attempt++) {
      const row = await prisma.siteContent.findUnique({ where: { key } });
      if (!row) {
        if (!cents(totalAmount) || Math.round(amount * 100) > Math.round(totalAmount * 100)) {
          return NextResponse.json({ error: "Enter the full service total. Payment cannot exceed the total." }, { status: 400 });
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
          serviceDate: booking.preferredDate || new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
          }).format(new Date()),
          dueDate: Math.round(amount * 100) < Math.round(totalAmount * 100) ? dueDate : "",
          lineItems: [{ id: "detail-service", description: booking.serviceName, quantity: 1, rate: totalAmount }],
          discountAmount: 0,
          taxRate: 0,
          notes: "Thank you for choosing Car Dash Detailing.",
          internalInspectionNotes: \`Owner reported offline payment received and SMS permission on \${new Date().toISOString()}. Not an independently verified bank transaction.\`,
          terms: "Payments are recorded as received. Any remaining balance is still owed.",
          paymentOptions: { check: false, cash: false, online: false, other: false },
          payments: [{ id: paymentId, amount, method, reference: reference || undefined, paidAt: new Date().toISOString() }],
          status: "partial",
          source: \`booking-paid:\${id}\`,
        });
        try {
          await prisma.siteContent.create({ data: { key, value: JSON.stringify(newInvoice) } });
          invoice = newInvoice;
          break;
        } catch (error) {
          if (uniqueConflict(error)) continue;
          throw error;
        }
      }

      let existing: InvoiceRecord;
      try {
        existing = JSON.parse(row.value) as InvoiceRecord;
      } catch {
        return NextResponse.json({ error: "Saved invoice is invalid. Open Invoices to review it." }, { status: 409 });
      }
      if (existing.status === "void") {
        return NextResponse.json({ error: "Cannot receive payment on a void invoice." }, { status: 409 });
      }

      // A repeated submission must never add another payment.
      if (existing.payments.some((payment) => payment.id === paymentId)) {
        invoice = existing;
        break;
      }
      const outstanding = calculateInvoiceTotals(existing).balance;
      if (outstanding <= 0) {
        return NextResponse.json({ error: "This invoice is already fully paid. No additional payment was recorded." }, { status: 409 });
      }
      if (Math.round(amount * 100) > Math.round(outstanding * 100)) {
        return NextResponse.json({ error: \`Payment exceeds the remaining balance of $\${outstanding.toFixed(2)}.\` }, { status: 400 });
      }

      const payments: InvoicePayment[] = [
        ...existing.payments,
        { id: paymentId, amount, method, reference: reference || undefined, paidAt: new Date().toISOString() },
      ];
      const updated = sanitizeInvoiceInput({
        ...existing,
        payments,
        dueDate: Math.round(amount * 100) === Math.round(outstanding * 100) ? "" : dueDate || existing.dueDate,
        status: "partial",
      }, existing);
      const changed = await prisma.siteContent.updateMany({
        where: { key, value: row.value },
        data: { value: JSON.stringify(updated) },
      });
      if (changed.count === 1) {
        invoice = updated;
        break;
      }
    }

    if (!invoice) return NextResponse.json({ error: "Another payment is being saved. Please retry." }, { status: 409 });
    const receiptPayment = invoice.payments.find((payment) => payment.id === paymentId);
    if (!receiptPayment) {
      return NextResponse.json({ error: "Payment not found on this invoice." }, { status: 409 });
    }
    const result = payloadForInvoice(invoice);

    // A distinct claim per payment prevents duplicate texts while allowing the
    // next week's payment to be acknowledged with its own receipt.
    const smsKey = \`payment-receipt-sms:\${identifier}:\${paymentId}\`;
    try {
      await prisma.siteContent.create({ data: { key: smsKey, value: "claimed" } });
    } catch (error) {
      if (uniqueConflict(error)) {
        const previous = await prisma.siteContent.findUnique({ where: { key: smsKey } });
        return NextResponse.json({ ...result, ...(previous?.value === "claimed" ? { sending: true } : { alreadySent: true }) }, {
          status: previous?.value === "claimed" ? 202 : 200,
        });
      }
      throw error;
    }

    let sent = false;
    try {
      const latest = await getInvoice(identifier);
      const payment = latest?.payments.find((item) => item.id === paymentId);
      if (!latest || latest.status === "void" || !payment) {
        await prisma.siteContent.delete({ where: { key: smsKey } }).catch(() => null);
        return NextResponse.json({ error: "Invoice changed. Refresh before texting." }, { status: 409 });
      }
      const link = \`\${getPublicSiteUrl()}/invoice/\${latest.shareToken}\`;
      const message = paymentReceiptSmsText(latest, link, payment);
      const delivery = await sendCustomerSmsWithHistory({ to: latest.customerPhone, body: message });
      if (!delivery.sent || !delivery.sid) {
        await prisma.siteContent.delete({ where: { key: smsKey } }).catch(() => null);
        return NextResponse.json({
          error: "Payment saved, but SMS could not be sent. You can retry, or text it from Invoices.",
          ...payloadForInvoice(latest),
        }, { status: 502 });
      }
      sent = true;
      try {
        await prisma.siteContent.update({ where: { key: smsKey }, data: { value: delivery.sid } });
        // sentAt is the FIRST text sent, not proof the invoice is fully paid.
        await saveInvoice({ ...latest, sentAt: latest.sentAt || new Date().toISOString() });
        const conversation = await ensureBookingConversation(id);
        await prisma.bookingMessage.upsert({
          where: { externalSid: delivery.sid },
          update: {},
          create: {
            conversationId: conversation.id, sender: "team",
            body: \`\${message}\nReply STOP to opt out or HELP for help.\`,
            channel: "sms", externalSid: delivery.sid,
          },
        });
        await prisma.bookingConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
      } catch (error) {
        console.error("Payment receipt sent but log update failed:", error);
      }
      const current = await getInvoice(identifier);
      return NextResponse.json({ ...payloadForInvoice(current || latest), smsSent: true });
    } catch (error) {
      if (!sent) await prisma.siteContent.delete({ where: { key: smsKey } }).catch(() => null);
      throw error;
    }
  } catch (error) {
    console.error("Booking payment receipt error:", error);
    return NextResponse.json({ error: "Could not create or text the receipt. Check Invoices before retrying." }, { status: 500 });
  }
}
