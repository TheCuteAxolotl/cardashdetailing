import { NextResponse } from "next/server";
import { getInvoiceByShareToken, saveInvoice } from "@/lib/invoices";
import { retrieveInvoiceCheckoutSession, stripeInvoiceRuntimeInfo } from "@/lib/stripe-invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    if (!stripeInvoiceRuntimeInfo.checkoutConfigured) {
      return NextResponse.json({ error: "Online payments are not configured yet." }, { status: 503 });
    }

    const { token } = await context.params;
    const invoice = await getInvoiceByShareToken(token);
    if (!invoice || invoice.status === "void") {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const sessionId = String(url.searchParams.get("session_id") || "");
    if (!sessionId) return NextResponse.json({ error: "Missing Checkout Session ID" }, { status: 400 });

    const session = await retrieveInvoiceCheckoutSession(sessionId);
    if (session.client_reference_id !== invoice.id || session.metadata?.invoice_id !== invoice.id) {
      return NextResponse.json({ error: "Checkout Session does not match this invoice" }, { status: 403 });
    }

    if (session.payment_status === "paid") {
      const alreadyRecorded = invoice.payments.some((payment) => payment.reference === session.id);
      if (!alreadyRecorded) {
        const amount = Math.max(0, Number(session.amount_total || 0) / 100);
        await saveInvoice({
          ...invoice,
          payments: [
            ...invoice.payments,
            {
              id: `stripe-${session.id}`,
              amount,
              method: "Stripe Online",
              reference: session.id,
              note: session.payment_intent ? `PaymentIntent ${session.payment_intent}` : undefined,
              paidAt: new Date().toISOString(),
            },
          ],
        });
      }
    }

    return NextResponse.json({
      paymentStatus: session.payment_status || "unknown",
      checkoutStatus: session.status || "unknown",
    });
  } catch (error) {
    console.error("Invoice checkout confirmation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not confirm online payment." },
      { status: 500 }
    );
  }
}
