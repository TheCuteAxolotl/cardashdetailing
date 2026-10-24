import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import { appendLoyaltyEvent, type LoyaltyCard, type LoyaltyEvent } from "@/lib/loyalty";

export const dynamic = "force-dynamic";
const PREFIX = "owner:loyalty:";
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
function date(value: unknown) {
  const d = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !Number.isFinite(Date.parse(d)) || new Date(d).toISOString().slice(0, 10) !== d || d > new Date().toISOString().slice(0, 10)) throw new Error("Enter a valid visit date that is not in the future.");
  return d;
}
export async function GET(request: NextRequest) {
  try {
    const account = await getCurrentAccountFromRequest(request);
    if (!isOwnerAccount(account)) return reply({ error: "Owner access required" }, 403);
    const rows = await prisma.siteContent.findMany({ where: { key: { startsWith: PREFIX } }, orderBy: { updatedAt: "desc" } });
    return reply({ cards: rows.map(row => JSON.parse(row.value) as LoyaltyCard) });
  } catch { return reply({ error: "Could not load loyalty records. Please try again." }, 500); }
}
export async function POST(request: NextRequest) {
  try {
    const account = await getCurrentAccountFromRequest(request);
    if (!account || !isOwnerAccount(account)) return reply({ error: "Owner access required" }, 403);
    if (request.headers.get("sec-fetch-site") === "cross-site") return reply({ error: "Invalid request origin" }, 403);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return reply({ error: "Invalid request" }, 400);
    const vin = text(body.vin, 40).toUpperCase().replace(/\s/g, "");
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return reply({ error: "Enter the full 17-character VIN (no I, O or Q)." }, 400);
    const requestId = text(body.requestId, 80);
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) return reply({ error: "Invalid request ID. Refresh and try again." }, 400);
    const key = PREFIX + vin;
    const row = await prisma.siteContent.findUnique({ where: { key } });
    const now = new Date().toISOString();
    if (body.action === "create") {
      if (row) {
        const existing = JSON.parse(row.value) as LoyaltyCard;
        if (existing.id === requestId) return reply({ card: existing });
        return reply({ error: "This VIN already has a loyalty card. Search the VIN to use its existing record." }, 409);
      }
      const customer = text(body.customer, 120), phone = text(body.phone, 40), vehicle = text(body.vehicle, 160);
      const opening = Number(body.opening || 0), notes = text(body.notes, 1000);
      if (!customer || !vehicle || phone.replace(/\D/g, "").length < 10) return reply({ error: "Enter the customer name, phone and vehicle year/make/model." }, 400);
      if (!Number.isInteger(opening) || opening < 0 || opening > 4 || (opening > 0 && !notes)) return reply({ error: "Opening visits must be 0–4. Explain how existing visits were verified." }, 400);
      const card: LoyaltyCard = { id: requestId, vin, customer, phone, vehicle, version: 1, createdAt: now, events: [{ id: requestId, type: "opening", credits: opening, date: date(body.date), service: "Card issued / verified opening visits", reference: "", notes, recordedAt: now, actor: account.email }] };
      await prisma.siteContent.create({ data: { key, value: JSON.stringify(card) } });
      return reply({ card }, 201);
    }
    if (!row) return reply({ error: "Card not found" }, 404);
    const card = JSON.parse(row.value) as LoyaltyCard;
    if (card.events.some(e => e.id === requestId)) return reply({ card });
    if (body.version !== card.version) return reply({ error: "This card changed in another session. Refresh the list before trying again." }, 409);
    if (!["visit", "redeem", "void"].includes(body.action)) return reply({ error: "Unknown action" }, 400);
    if (body.action === "visit" && body.paid !== true) return reply({ error: "Confirm this was a completed, paid detail." }, 400);
    const event: LoyaltyEvent = { id: requestId, type: body.action, credits: body.action === "visit" ? 1 : body.action === "redeem" ? -4 : 0, date: date(body.date), service: body.action === "redeem" ? "Free Essential Detail" : text(body.service, 160), reference: text(body.reference, 120), notes: text(body.notes, 1000), targetId: text(body.targetId, 80) || undefined, recordedAt: now, actor: account.email };
    if (event.type === "visit" && !event.service) return reply({ error: "Enter the service performed." }, 400);
    let next: LoyaltyCard;
    try { next = appendLoyaltyEvent(card, event); } catch (error) { return reply({ error: error instanceof Error ? error.message : "Invalid entry" }, 400); }
    const result = await prisma.siteContent.updateMany({ where: { key, value: row.value }, data: { value: JSON.stringify(next) } });
    if (!result.count) return reply({ error: "Another update arrived first. Refresh and try again." }, 409);
    return reply({ card: next });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return reply({ error: "This VIN already has a card. Refresh the list." }, 409);
    if (error instanceof Error && error.message.startsWith("Enter a valid visit")) return reply({ error: error.message }, 400);
    return reply({ error: "Could not save this entry. Your existing records are unchanged; please retry." }, 500);
  }
}
