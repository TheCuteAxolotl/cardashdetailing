import { NextResponse } from "next/server";
import { getInvoice, saveInvoice } from "@/lib/invoices";
import { verifyStripeWebhook } from "@/lib/stripe-invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function recordCheckoutPayment(session: {
  id: string;
  payment_status?: string | null;
  amount_total?: number | null;
  payment_intent?: string | null;
  client_reference_id?: string | null;
  metadata?: Record<string, string> | null;
}) {
  if (session.payment_status !== "paid") return;
  const invoiceId = session.metadata?.invoice_id || session.client_reference_id || "";
  if (!invoiceId) return;

  const invoice = await getInvoice(invoiceId);
  if (!invoice || invoice.status === "void") return;
  if (invoice.payments.some((payment) => payment.reference === session.id)) return;

  const amount = Math.max(0, Number(session.amount_total || 0) / 100);
  if (amount <= 0) return;

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

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    const event = verifyStripeWebhook(rawBody, request.headers.get("stripe-signature"));
    const session = event.data?.object;

    if (
      session &&
      (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded")
    ) {
      await recordCheckoutPayment(session);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe invoice webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe webhook" },
      { status: 400 }
    );
  }
}
