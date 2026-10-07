import { NextRequest, NextResponse } from "next/server";
import {
  STANDARD_MAINTENANCE_PLAN,
  createPendingMaintenanceSubscription,
  getMaintenanceOfferByToken,
  listMaintenanceSubscriptions,
  updateMaintenanceCheckoutSession,
} from "@/lib/maintenance";
import { createMaintenanceCheckoutSession } from "@/lib/stripe-maintenance";
import { normalizePhoneNumber } from "@/lib/twilio-sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const offerToken = String(body.offerToken || "").trim();
    const requestedName = String(body.customerName || "").trim().slice(0, 120);
    const requestedEmail = String(body.customerEmail || "").trim().toLowerCase().slice(0, 200);
    const requestedPhone = normalizePhoneNumber(String(body.customerPhone || "")) || null;
    const termsAccepted = body.termsAccepted === true;

    if (!termsAccepted) {
      return NextResponse.json({ error: "Please agree to the recurring subscription terms." }, { status: 400 });
    }

    let offerId: string | null = null;
    let shareToken: string | null = null;
    let planName = STANDARD_MAINTENANCE_PLAN.name;
    let description = STANDARD_MAINTENANCE_PLAN.description;
    let amountCents = STANDARD_MAINTENANCE_PLAN.amountCents;
    let customerName = requestedName;
    let customerEmail = requestedEmail;
    let customerPhone = requestedPhone;

    if (offerToken) {
      const offer = await getMaintenanceOfferByToken(offerToken);
      if (!offer || !offer.active) {
        return NextResponse.json({ error: "This private maintenance offer is no longer available." }, { status: 404 });
      }

      const existing = (await listMaintenanceSubscriptions()).find(
        (item) =>
          item.offerId === offer.id &&
          ["active", "trialing", "past_due", "unpaid"].includes(item.status)
      );
      if (existing) {
        return NextResponse.json(
          { error: "This private offer already has an active subscription." },
          { status: 409 }
        );
      }

      offerId = offer.id;
      shareToken = offer.shareToken;
      planName = offer.name;
      description = offer.description || "Private monthly maintenance plan with Car Dash Detailing.";
      amountCents = offer.amountCents;
      customerName = offer.customerName || requestedName;
      customerEmail = (offer.customerEmail || requestedEmail).toLowerCase();
      customerPhone = normalizePhoneNumber(offer.customerPhone || requestedPhone || "") || null;
    }

    if (!customerName) {
      return NextResponse.json({ error: "Your name is required." }, { status: 400 });
    }
    if (!validEmail(customerEmail)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (!Number.isFinite(amountCents) || amountCents < 100) {
      return NextResponse.json({ error: "This subscription price is invalid." }, { status: 400 });
    }

    const pending = await createPendingMaintenanceSubscription({
      offerId,
      planName,
      amountCents,
      customerName,
      customerEmail,
      customerPhone,
    });
    if (!pending) throw new Error("Could not create subscription record.");

    const session = await createMaintenanceCheckoutSession({
      subscriptionId: pending.id,
      manageToken: pending.manageToken,
      offerId,
      offerToken: shareToken,
      planName,
      description,
      amountCents,
      customerEmail,
    });

    await updateMaintenanceCheckoutSession(pending.id, session.id);

    return NextResponse.json({
      success: true,
      url: session.url,
      manageToken: pending.manageToken,
    });
  } catch (error) {
    console.error("Maintenance subscription checkout failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start subscription checkout." },
      { status: 500 }
    );
  }
}
