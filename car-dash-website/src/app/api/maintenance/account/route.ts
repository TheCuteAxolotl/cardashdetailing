import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountFromRequest } from "@/lib/permissions";
import { listMaintenanceSubscriptionsForEmail } from "@/lib/maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const account = await getCurrentAccountFromRequest(request);
    if (!account) return NextResponse.json({ error: "Login required." }, { status: 401 });

    const subscriptions = await listMaintenanceSubscriptionsForEmail(account.email);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Account maintenance subscriptions failed:", error);
    return NextResponse.json({ error: "Could not load subscriptions." }, { status: 500 });
  }
}
