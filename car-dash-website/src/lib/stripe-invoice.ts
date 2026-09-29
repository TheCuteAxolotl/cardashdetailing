import { createHmac, timingSafeEqual } from "crypto";
import type { InvoiceRecord } from "@/lib/invoices";
import { calculateInvoiceTotals } from "@/lib/invoices";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";

export const stripeInvoiceRuntimeInfo = {
  secretKeyConfigured: Boolean(stripeSecretKey),
  webhookSecretConfigured: Boolean(stripeWebhookSecret),
  checkoutConfigured: Boolean(stripeSecretKey),
  fullyConfigured: Boolean(stripeSecretKey && stripeWebhookSecret),
};

type StripeCheckoutSession = {
  id: string;
  url?: string | null;
  payment_status?: string | null;
  status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  client_reference_id?: string | null;
  payment_intent?: string | null;
  metadata?: Record<string, string> | null;
};

type StripeEvent = {
  id: string;
  type: string;
  data?: { object?: StripeCheckoutSession };
};

function publicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://cardashdetailing.com").replace(/\/$/, "");
}

async function stripeRequest(path: string, init?: RequestInit) {
  if (!stripeSecretKey) {
    throw new Error("Stripe is not configured on the server yet.");
  }

  const response = await fetch(`https://api.stripe.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : `Stripe returned ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}

function safeCheckoutDescription(invoice: InvoiceRecord) {
  const text = invoice.lineItems
    .map((item) => item.description)
    .filter(Boolean)
    .join(", ")
    .slice(0, 450);
  return text || `${invoice.assetType || "Detailing"} service`;
}

export async function createInvoiceCheckoutSession(invoice: InvoiceRecord) {
  const totals = calculateInvoiceTotals(invoice);
  const amountCents = Math.round(totals.balance * 100);

  if (amountCents <= 0) throw new Error("This invoice has no remaining balance.");
  if (!invoice.paymentOptions.online) throw new Error("Online payment is disabled for this invoice.");

  const site = publicSiteUrl();
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("submit_type", "pay");
  form.set("success_url", `${site}/invoice/${invoice.shareToken}?payment=success&session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${site}/invoice/${invoice.shareToken}?payment=cancelled`);
  form.set("client_reference_id", invoice.id);
  form.set("payment_method_types[0]", "card");
  form.set("payment_method_types[1]", "us_bank_account");
  form.set("metadata[invoice_id]", invoice.id);
  form.set("metadata[invoice_number]", invoice.invoiceNumber);
  form.set("payment_intent_data[metadata][invoice_id]", invoice.id);
  form.set("payment_intent_data[metadata][invoice_number]", invoice.invoiceNumber);
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][product_data][name]", `Car Dash Detailing · ${invoice.invoiceNumber}`);
  form.set("line_items[0][price_data][product_data][description]", safeCheckoutDescription(invoice));
  form.set("line_items[0][price_data][unit_amount]", String(amountCents));
  form.set("line_items[0][quantity]", "1");
  if (invoice.customerEmail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invoice.customerEmail)) {
    form.set("customer_email", invoice.customerEmail);
  }

  const payload = await stripeRequest("/v1/checkout/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });

  const session = payload as StripeCheckoutSession;
  if (!session.id || !session.url) throw new Error("Stripe did not return a checkout URL.");
  return session;
}

export async function retrieveInvoiceCheckoutSession(sessionId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new Error("Invalid Stripe Checkout Session ID.");
  return (await stripeRequest(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`)) as StripeCheckoutSession;
}

export function verifyStripeWebhook(rawBody: string, signatureHeader: string | null) {
  if (!stripeWebhookSecret) throw new Error("Stripe webhook secret is not configured.");
  if (!signatureHeader) throw new Error("Missing Stripe-Signature header.");

  const parts = signatureHeader.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) throw new Error("Invalid Stripe signature header.");

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) {
    throw new Error("Stripe webhook timestamp is outside the allowed tolerance.");
  }

  const expected = createHmac("sha256", stripeWebhookSecret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const valid = signatures.some((signature) => {
    const candidate = Buffer.from(signature, "utf8");
    return candidate.length === expectedBuffer.length && timingSafeEqual(candidate, expectedBuffer);
  });

  if (!valid) throw new Error("Stripe webhook signature verification failed.");
  return JSON.parse(rawBody) as StripeEvent;
}

export type { StripeCheckoutSession, StripeEvent };
