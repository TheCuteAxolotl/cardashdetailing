import { getPublicSiteUrl } from "@/lib/twilio-sms";
import { stripeRequest, type StripeCheckoutSession } from "@/lib/stripe-invoice";

export type StripeMaintenanceSubscription = {
  id: string;
  object?: string;
  customer?: string | null;
  status?: string | null;
  cancel_at_period_end?: boolean;
  current_period_end?: number | null;
  metadata?: Record<string, string> | null;
};

export async function createMaintenanceCheckoutSession(input: {
  subscriptionId: string;
  manageToken: string;
  offerId?: string | null;
  offerToken?: string | null;
  planName: string;
  description: string;
  amountCents: number;
  customerEmail: string;
}) {
  const site = getPublicSiteUrl();
  const form = new URLSearchParams();

  form.set("mode", "subscription");
  form.set("success_url", `${site}/maintenance/manage/${encodeURIComponent(input.manageToken)}?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  form.set(
    "cancel_url",
    input.offerToken
      ? `${site}/maintenance/${encodeURIComponent(input.offerToken)}?checkout=cancelled`
      : `${site}/maintenance?checkout=cancelled`
  );
  form.set("client_reference_id", input.subscriptionId);
  form.set("customer_email", input.customerEmail);
  form.set("payment_method_types[0]", "card");
  form.set("metadata[maintenance_subscription_id]", input.subscriptionId);
  form.set("metadata[maintenance_terms_version]", "2026-10-06");
  if (input.offerId) form.set("metadata[maintenance_offer_id]", input.offerId);
  form.set("subscription_data[metadata][maintenance_subscription_id]", input.subscriptionId);
  form.set("subscription_data[metadata][maintenance_terms_version]", "2026-10-06");
  if (input.offerId) form.set("subscription_data[metadata][maintenance_offer_id]", input.offerId);

  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
  form.set("line_items[0][price_data][recurring][interval]", "month");
  form.set("line_items[0][price_data][product_data][name]", `Car Dash Detailing · ${input.planName}`);
  form.set("line_items[0][price_data][product_data][description]", input.description.slice(0, 450));
  form.set("line_items[0][quantity]", "1");

  const session = (await stripeRequest("/v1/checkout/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  })) as StripeCheckoutSession;

  if (!session.id || !session.url) throw new Error("Stripe did not return a subscription checkout URL.");
  return session;
}

export async function retrieveMaintenanceCheckoutSession(sessionId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new Error("Invalid Stripe Checkout Session ID.");
  return (await stripeRequest(
    `/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`
  )) as StripeCheckoutSession & {
    subscription?: string | StripeMaintenanceSubscription | null;
  };
}

export async function retrieveMaintenanceSubscription(subscriptionId: string) {
  if (!/^sub_[A-Za-z0-9_]+$/.test(subscriptionId)) throw new Error("Invalid Stripe subscription ID.");
  return (await stripeRequest(
    `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`
  )) as StripeMaintenanceSubscription;
}

export async function setMaintenanceSubscriptionCancelAtPeriodEnd(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean
) {
  if (!/^sub_[A-Za-z0-9_]+$/.test(subscriptionId)) throw new Error("Invalid Stripe subscription ID.");
  const form = new URLSearchParams();
  form.set("cancel_at_period_end", cancelAtPeriodEnd ? "true" : "false");

  return (await stripeRequest(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  })) as StripeMaintenanceSubscription;
}
