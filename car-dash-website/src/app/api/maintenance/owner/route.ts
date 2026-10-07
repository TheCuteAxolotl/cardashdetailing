import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import {
  STANDARD_MAINTENANCE_PLAN,
  createMaintenanceOffer,
  getMaintenanceOfferById,
  getMaintenanceSubscriptionById,
  listMaintenanceOffers,
  listMaintenanceSubscriptions,
  setMaintenanceOfferActive,
  syncMaintenanceSubscription,
} from "@/lib/maintenance";
import { normalizePhoneNumber, getPublicSiteUrl, sendTransactionalSms } from "@/lib/twilio-sms";
import {
  retrieveMaintenanceSubscription,
  setMaintenanceSubscriptionCancelAtPeriodEnd,
} from "@/lib/stripe-maintenance";
import { stripeInvoiceRuntimeInfo } from "@/lib/stripe-invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireOwner(request: NextRequest) {
  const account = await getCurrentAccountFromRequest(request);
  return isOwnerAccount(account) ? account : null;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireOwner(request))) {
      return NextResponse.json({ error: "Owner access required." }, { status: 403 });
    }

    const [offers, storedSubscriptions] = await Promise.all([
      listMaintenanceOffers(),
      listMaintenanceSubscriptions(),
    ]);

    const subscriptions = await Promise.all(
      storedSubscriptions.map(async (item) => {
        if (!item.stripeSubscriptionId) return item;
        try {
          const stripe = await retrieveMaintenanceSubscription(item.stripeSubscriptionId);
          return (
            (await syncMaintenanceSubscription({
              id: item.id,
              stripeCustomerId: typeof stripe.customer === "string" ? stripe.customer : null,
              stripeSubscriptionId: stripe.id,
              status: stripe.status || item.status,
              cancelAtPeriodEnd: Boolean(stripe.cancel_at_period_end),
              currentPeriodEnd: stripe.current_period_end || null,
            })) || item
          );
        } catch {
          return item;
        }
      })
    );

    return NextResponse.json({
      standardPlan: STANDARD_MAINTENANCE_PLAN,
      offers,
      subscriptions,
      stripeConfigured: stripeInvoiceRuntimeInfo.checkoutConfigured,
    });
  } catch (error) {
    console.error("Maintenance owner load failed:", error);
    return NextResponse.json({ error: "Could not load maintenance subscriptions." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireOwner(request))) {
      return NextResponse.json({ error: "Owner access required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "create_offer") {
      const customerName = String(body.customerName || "").trim().slice(0, 120);
      const customerEmail = String(body.customerEmail || "").trim().toLowerCase().slice(0, 200) || null;
      const customerPhone = normalizePhoneNumber(String(body.customerPhone || "")) || null;
      const name = String(body.name || "Custom Maintenance").trim().slice(0, 140) || "Custom Maintenance";
      const description = String(body.description || "").trim().slice(0, 600);
      const amountCents = Math.round(Number(body.monthlyPrice || 0) * 100);

      if (!customerName) {
        return NextResponse.json({ error: "Client name is required." }, { status: 400 });
      }
      if (!customerEmail && !customerPhone) {
        return NextResponse.json({ error: "Add the client's email or phone number." }, { status: 400 });
      }
      if (!Number.isFinite(amountCents) || amountCents < 100 || amountCents > 1000000) {
        return NextResponse.json({ error: "Enter a valid monthly price." }, { status: 400 });
      }

      const offer = await createMaintenanceOffer({
        name,
        description,
        amountCents,
        customerName,
        customerEmail,
        customerPhone,
      });
      if (!offer) throw new Error("Could not create maintenance offer.");

      const link = `${getPublicSiteUrl()}/maintenance/${offer.shareToken}`;
      let sent = false;
      let sendWarning = "";

      if (Boolean(body.sendNow) && customerPhone) {
        const sms = await sendTransactionalSms({
          to: customerPhone,
          body: `Car Dash Detailing: Your private monthly maintenance plan is ready: ${link}`,
        });
        sent = sms.sent;
        if (!sms.sent) sendWarning = "Offer created, but the text message could not be sent.";
      }

      return NextResponse.json({ success: true, offer, link, sent, warning: sendWarning || undefined });
    }

    if (action === "send_offer") {
      const offer = await getMaintenanceOfferById(String(body.offerId || ""));
      if (!offer) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
      if (!offer.customerPhone) {
        return NextResponse.json({ error: "This offer does not have a client phone number." }, { status: 400 });
      }

      const link = `${getPublicSiteUrl()}/maintenance/${offer.shareToken}`;
      const sms = await sendTransactionalSms({
        to: offer.customerPhone,
        body: `Car Dash Detailing: Your private monthly maintenance plan is ready: ${link}`,
      });

      if (!sms.sent) {
        return NextResponse.json({ error: "The offer link could not be sent by text." }, { status: 502 });
      }
      return NextResponse.json({ success: true, link });
    }

    if (action === "set_offer_active") {
      const offer = await setMaintenanceOfferActive(String(body.offerId || ""), Boolean(body.active));
      if (!offer) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
      return NextResponse.json({ success: true, offer });
    }

    if (action === "cancel_subscription" || action === "resume_subscription") {
      const subscription = await getMaintenanceSubscriptionById(String(body.subscriptionId || ""));
      if (!subscription) return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
      if (!subscription.stripeSubscriptionId) {
        return NextResponse.json({ error: "This subscription is not active in Stripe." }, { status: 409 });
      }

      const stripe = await setMaintenanceSubscriptionCancelAtPeriodEnd(
        subscription.stripeSubscriptionId,
        action === "cancel_subscription"
      );
      const updated = await syncMaintenanceSubscription({
        id: subscription.id,
        stripeCustomerId: typeof stripe.customer === "string" ? stripe.customer : null,
        stripeSubscriptionId: stripe.id,
        status: stripe.status || subscription.status,
        cancelAtPeriodEnd: Boolean(stripe.cancel_at_period_end),
        currentPeriodEnd: stripe.current_period_end || null,
      });
      return NextResponse.json({ success: true, subscription: updated });
    }

    return NextResponse.json({ error: "Invalid maintenance action." }, { status: 400 });
  } catch (error) {
    console.error("Maintenance owner action failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update maintenance subscriptions." },
      { status: 500 }
    );
  }
}
