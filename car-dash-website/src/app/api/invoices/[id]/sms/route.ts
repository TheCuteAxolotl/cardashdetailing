import { sendCustomerSmsWithHistory } from "@/lib/customer-sms-history";
import { invoiceSmsText, isInvoiceFullyPaid } from "@/lib/paid-receipt";
import { ensureBookingConversation } from "@/lib/booking-chat";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getInvoice, requireOwner, saveInvoice } from "@/lib/invoices";
import { getPublicSiteUrl } from "@/lib/twilio-sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    const { id } = await context.params;
    const invoice = await getInvoice(id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.status === "void") {
      return NextResponse.json({ error: "Cannot text a void invoice." }, { status: 409 });
    }
    if (!invoice.customerPhone) {
      return NextResponse.json({ error: "Add a customer phone number first" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const link = `${getPublicSiteUrl()}/invoice/${invoice.shareToken}`;
    const message = String(body?.message || invoiceSmsText(invoice, link)).trim().slice(0, 1200);

    const result = await sendCustomerSmsWithHistory({ to: invoice.customerPhone, body: message });
    if (!result.sent) {
      return NextResponse.json({ error: `SMS could not be sent (${result.reason})` }, { status: 502 });
    }

    // Link booking-origin receipts to their existing appointment chat too.
    // The unified phone inbox deduplicates the Twilio SID if it appears in both.
    if (invoice.source?.startsWith("booking-paid:") && result.sid) {
      try {
        const bookingId = invoice.source.slice("booking-paid:".length);
        const conversation = await ensureBookingConversation(bookingId);
        await prisma.bookingMessage.upsert({
          where: { externalSid: result.sid },
          update: {},
          create: { conversationId: conversation.id, sender: "team", body: `${message}\nReply STOP to opt out or HELP for help.`, channel: "sms", externalSid: result.sid },
        });
        await prisma.bookingConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
      } catch (error) { console.error("Could not add invoice SMS to booking conversation:", error); }
    }

    const now = new Date().toISOString();
    const saved = await saveInvoice({
      ...invoice,
      sentAt: invoice.sentAt || now,
      status: invoice.status === "draft" ? "sent" : invoice.status,
    });

    return NextResponse.json({ ok: true, sid: result.sid, invoice: saved, link, receipt: isInvoiceFullyPaid(saved) });
  } catch (error) {
    console.error("Invoice SMS error:", error);
    return NextResponse.json({ error: "Could not send invoice SMS" }, { status: 500 });
  }
}
