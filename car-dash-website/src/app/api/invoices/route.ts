import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import {
  calculateInvoiceTotals,
  listInvoices,
  nextInvoiceNumber,
  sanitizeInvoiceInput,
  saveInvoice,
} from "@/lib/invoices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!(hasStaffPermission(await getCurrentAccountFromRequest(request), "invoices"))) {
      return NextResponse.json({ error: "Permission required" }, { status: 403 });
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

export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentAccountFromRequest(request);
    if (!hasStaffPermission(actor, "invoices") || !actor) {
      return NextResponse.json({ error: "Permission required" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const invoiceNumber = String(body?.invoiceNumber || "").trim() || (await nextInvoiceNumber());
    const invoice = { ...sanitizeInvoiceInput({ ...body, id: undefined, invoiceNumber, status: body?.status || "draft" }), createdById: actor.id, createdByName: actor.name };

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
