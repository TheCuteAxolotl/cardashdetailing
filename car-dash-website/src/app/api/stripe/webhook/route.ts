import { NextResponse } from "next/server";
import { getInvoice, saveInvoice } from "@/lib/invoices";
import { verifyStripeWebhook } from "@/lib/stripe-invoice";
import {
  getMaintenanceSubscriptionById,
  getMaintenanceSubscriptionByStripeId,
  syncMaintenanceSubscription,
} from "@/lib/maintenance";
import { retrieveMaintenanceSubscription } from "@/lib/stripe-maintenance";

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

async function recordMaintenanceCheckout(session: any) {
  const localId = String(session?.metadata?.maintenance_subscription_id || session?.client_reference_id || "");
  if (!localId) return;

  const local = await getMaintenanceSubscriptionById(localId);
  if (!local) return;

  const subscriptionId =
    typeof session?.subscription === "string"
      ? session.subscription
      : typeof session?.subscription?.id === "string"
        ? session.subscription.id
        : "";
  if (!subscriptionId) return;

  const stripe = await retrieveMaintenanceSubscription(subscriptionId);
  await syncMaintenanceSubscription({
    id: local.id,
    stripeCheckoutSessionId: String(session.id || local.stripeCheckoutSessionId || ""),
    stripeCustomerId:
      typeof session.customer === "string"
        ? session.customer
        : typeof stripe.customer === "string"
          ? stripe.customer
          : null,
    stripeSubscriptionId: stripe.id,
    status: stripe.status || "active",
    cancelAtPeriodEnd: Boolean(stripe.cancel_at_period_end),
    currentPeriodEnd: stripe.current_period_end || null,
  });
}

async function recordMaintenanceSubscription(object: any) {
  const stripeId = typeof object?.id === "string" ? object.id : "";
  if (!stripeId) return;

  const localId = String(object?.metadata?.maintenance_subscription_id || "");
  const local = localId
    ? await getMaintenanceSubscriptionById(localId)
    : await getMaintenanceSubscriptionByStripeId(stripeId);
  if (!local) return;

  await syncMaintenanceSubscription({
    id: local.id,
    stripeCustomerId: typeof object.customer === "string" ? object.customer : null,
    stripeSubscriptionId: stripeId,
    status: String(object.status || local.status),
    cancelAtPeriodEnd: Boolean(object.cancel_at_period_end),
    currentPeriodEnd:
      typeof object.current_period_end === "number" ? object.current_period_end : null,
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
      if (session.metadata?.maintenance_subscription_id) {
        await recordMaintenanceCheckout(session);
      }
    }

    if (
      session &&
      (event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.deleted")
    ) {
      await recordMaintenanceSubscription(session);
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
