import { NextResponse } from "next/server";
import { getInvoiceByShareToken } from "@/lib/invoices";
import { createInvoiceCheckoutSession, stripeInvoiceRuntimeInfo } from "@/lib/stripe-invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    if (!stripeInvoiceRuntimeInfo.checkoutConfigured) {
      return NextResponse.json({ error: "Online payments are not configured yet." }, { status: 503 });
    }

    const { token } = await context.params;
    const invoice = await getInvoiceByShareToken(token);
    if (!invoice || invoice.status === "void") {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const session = await createInvoiceCheckoutSession(invoice);
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Invoice checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start online payment." },
      { status: 500 }
    );
  }
}
