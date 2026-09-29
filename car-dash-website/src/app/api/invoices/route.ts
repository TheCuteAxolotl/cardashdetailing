import { NextResponse } from "next/server";
import {
  calculateInvoiceTotals,
  listInvoices,
  nextInvoiceNumber,
  requireOwner,
  sanitizeInvoiceInput,
  saveInvoice,
} from "@/lib/invoices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    const invoices = await listInvoices();
    return NextResponse.json({
      invoices: invoices.map((invoice) => ({ ...invoice, totals: calculateInvoiceTotals(invoice) })),
    });
  } catch (error) {
    console.error("Invoice list error:", error);
    return NextResponse.json({ error: "Could not load invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const invoiceNumber = String(body?.invoiceNumber || "").trim() || (await nextInvoiceNumber());
    const invoice = sanitizeInvoiceInput({ ...body, invoiceNumber, status: body?.status || "draft" });

    if (!invoice.customerName) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }
    if (!invoice.lineItems.length) {
      return NextResponse.json({ error: "Add at least one invoice item" }, { status: 400 });
    }

    const saved = await saveInvoice(invoice);
    return NextResponse.json({ invoice: { ...saved, totals: calculateInvoiceTotals(saved) } }, { status: 201 });
  } catch (error) {
    console.error("Invoice create error:", error);
    return NextResponse.json({ error: "Could not create invoice" }, { status: 500 });
  }
}
