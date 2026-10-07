import { NextRequest, NextResponse } from "next/server";
import {
  getMaintenanceSubscriptionByManageToken,
  syncMaintenanceSubscription,
} from "@/lib/maintenance";
import {
  retrieveMaintenanceCheckoutSession,
  retrieveMaintenanceSubscription,
  setMaintenanceSubscriptionCancelAtPeriodEnd,
  type StripeMaintenanceSubscription,
} from "@/lib/stripe-maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function refreshSubscription(local: NonNullable<Awaited<ReturnType<typeof getMaintenanceSubscriptionByManageToken>>>) {
  if (!local.stripeSubscriptionId) return local;
  const stripe = await retrieveMaintenanceSubscription(local.stripeSubscriptionId);
  return (
    (await syncMaintenanceSubscription({
      id: local.id,
      stripeCustomerId: typeof stripe.customer === "string" ? stripe.customer : null,
      stripeSubscriptionId: stripe.id,
      status: stripe.status || local.status,
      cancelAtPeriodEnd: Boolean(stripe.cancel_at_period_end),
      currentPeriodEnd: stripe.current_period_end || null,
    })) || local
  );
}

async function confirmCheckout(
  local: NonNullable<Awaited<ReturnType<typeof getMaintenanceSubscriptionByManageToken>>>,
  sessionId: string
) {
  const session = await retrieveMaintenanceCheckoutSession(sessionId);
  const reference = session.metadata?.maintenance_subscription_id || session.client_reference_id || "";
  if (reference !== local.id) throw new Error("This checkout session does not belong to this subscription.");

  let stripeSubscription: StripeMaintenanceSubscription | null = null;
  if (typeof session.subscription === "string") {
    stripeSubscription = await retrieveMaintenanceSubscription(session.subscription);
  } else if (session.subscription && typeof session.subscription === "object") {
    stripeSubscription = session.subscription;
  }

  if (!stripeSubscription?.id) return local;

  return (
    (await syncMaintenanceSubscription({
      id: local.id,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId:
        typeof session.customer === "string"
          ? session.customer
          : typeof stripeSubscription.customer === "string"
            ? stripeSubscription.customer
            : null,
      stripeSubscriptionId: stripeSubscription.id,
      status: stripeSubscription.status || "active",
      cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
      currentPeriodEnd: stripeSubscription.current_period_end || null,
    })) || local
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    let subscription = await getMaintenanceSubscriptionByManageToken(token);
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    }

    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (sessionId) subscription = await confirmCheckout(subscription, sessionId);
    else subscription = await refreshSubscription(subscription);

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Maintenance subscription load failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load subscription." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const subscription = await getMaintenanceSubscriptionByManageToken(token);
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    }
    if (!subscription.stripeSubscriptionId) {
      return NextResponse.json({ error: "This subscription is not active in Stripe yet." }, { status: 409 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");
    if (!["cancel", "resume"].includes(action)) {
      return NextResponse.json({ error: "Invalid subscription action." }, { status: 400 });
    }

    const stripe = await setMaintenanceSubscriptionCancelAtPeriodEnd(
      subscription.stripeSubscriptionId,
      action === "cancel"
    );

    const updated = await syncMaintenanceSubscription({
      id: subscription.id,
      stripeCustomerId: typeof stripe.customer === "string" ? stripe.customer : null,
      stripeSubscriptionId: stripe.id,
      status: stripe.status || subscription.status,
      cancelAtPeriodEnd: Boolean(stripe.cancel_at_period_end),
      currentPeriodEnd: stripe.current_period_end || null,
    });

    return NextResponse.json({
      success: true,
      subscription: updated,
      message:
        action === "cancel"
          ? "Your subscription will end after the current billing period."
          : "Your subscription will continue renewing monthly.",
    });
  } catch (error) {
    console.error("Maintenance subscription update failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update subscription." },
      { status: 500 }
    );
  }
}
