import { NextResponse } from "next/server";
import { calculateInvoiceTotals, getInvoiceByShareToken, saveInvoice } from "@/lib/invoices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const invoice = await getInvoiceByShareToken(token);
    if (!invoice || invoice.status === "void") {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    let current = invoice;
    if (!invoice.viewedAt || invoice.status === "sent" || invoice.status === "draft") {
      current = await saveInvoice({
        ...invoice,
        viewedAt: invoice.viewedAt || new Date().toISOString(),
        status: invoice.status === "paid" || invoice.status === "partial" ? invoice.status : "viewed",
      });
    }

    return NextResponse.json({
      invoice: {
        ...current,
        shareToken: undefined,
        totals: calculateInvoiceTotals(current),
      },
    });
  } catch (error) {
    console.error("Public invoice error:", error);
    return NextResponse.json({ error: "Could not load invoice" }, { status: 500 });
  }
}
