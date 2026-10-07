import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountFromRequest } from "@/lib/permissions";
import { listMaintenanceSubscriptionsForEmail, syncMaintenanceSubscription } from "@/lib/maintenance";
import { retrieveMaintenanceSubscription } from "@/lib/stripe-maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const account = await getCurrentAccountFromRequest(request);
    if (!account) return NextResponse.json({ error: "Login required." }, { status: 401 });

    const stored = await listMaintenanceSubscriptionsForEmail(account.email);
    const subscriptions = await Promise.all(
      stored.map(async (item) => {
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
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Account maintenance subscriptions failed:", error);
    return NextResponse.json({ error: "Could not load subscriptions." }, { status: 500 });
  }
}
