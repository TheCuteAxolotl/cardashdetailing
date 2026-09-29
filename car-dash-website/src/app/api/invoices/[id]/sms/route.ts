import { NextResponse } from "next/server";
import { calculateInvoiceTotals, getInvoice, requireOwner, saveInvoice } from "@/lib/invoices";
import { getPublicSiteUrl, sendTransactionalSms } from "@/lib/twilio-sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    const { id } = await context.params;
    const invoice = await getInvoice(id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (!invoice.customerPhone) {
      return NextResponse.json({ error: "Add a customer phone number first" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const totals = calculateInvoiceTotals(invoice);
    const link = `${getPublicSiteUrl()}/invoice/${invoice.shareToken}`;
    const defaultMessage = `Hi ${invoice.customerName}, here is your Car Dash Detailing invoice ${invoice.invoiceNumber}. Balance due: ${formatCurrency(totals.balance)}. View it here: ${link}`;
    const message = String(body?.message || defaultMessage).trim().slice(0, 1200);

    const result = await sendTransactionalSms({ to: invoice.customerPhone, body: message });
    if (!result.sent) {
      return NextResponse.json({ error: `SMS could not be sent (${result.reason})` }, { status: 502 });
    }

    const now = new Date().toISOString();
    const saved = await saveInvoice({
      ...invoice,
      sentAt: invoice.sentAt || now,
      status: invoice.status === "draft" ? "sent" : invoice.status,
    });

    return NextResponse.json({ ok: true, sid: result.sid, invoice: saved, link });
  } catch (error) {
    console.error("Invoice SMS error:", error);
    return NextResponse.json({ error: "Could not send invoice SMS" }, { status: 500 });
  }
}
