import { NextResponse } from "next/server";
import {
  calculateInvoiceTotals,
  deleteInvoice,
  getInvoice,
  requireOwner,
  sanitizeInvoiceInput,
  saveInvoice,
} from "@/lib/invoices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    const { id } = await context.params;
    const invoice = await getInvoice(id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    return NextResponse.json({ invoice: { ...invoice, totals: calculateInvoiceTotals(invoice) } });
  } catch (error) {
    console.error("Invoice read error:", error);
    return NextResponse.json({ error: "Could not load invoice" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await getInvoice(id);
    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const invoice = sanitizeInvoiceInput(body, existing);
    if (!invoice.customerName) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }
    if (!invoice.lineItems.length) {
      return NextResponse.json({ error: "Add at least one invoice item" }, { status: 400 });
    }

    const saved = await saveInvoice(invoice);
    return NextResponse.json({ invoice: { ...saved, totals: calculateInvoiceTotals(saved) } });
  } catch (error) {
    console.error("Invoice update error:", error);
    return NextResponse.json({ error: "Could not update invoice" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }
    const { id } = await context.params;
    await deleteInvoice(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Invoice delete error:", error);
    return NextResponse.json({ error: "Could not delete invoice" }, { status: 500 });
  }
}
