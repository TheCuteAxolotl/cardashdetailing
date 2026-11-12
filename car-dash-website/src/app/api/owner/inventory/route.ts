import {
  getCurrentAccountFromRequest, hasStaffPermission, isOwnerAccount,
  type CurrentAccount,
} from "@/lib/permissions";
import { archiveDeletion } from "@/lib/deletion-history";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const OWNER_KEY = "owner:supplies-inventory:v1";
export const inventoryKey = (scope: string) =>
  scope === "owner" ? OWNER_KEY : "detailer:supplies-inventory:v1:" + scope.slice(6);

async function resolveScope(account: CurrentAccount, requested: unknown) {
  const value = String(requested || "").trim();
  if (!isOwnerAccount(account)) return { scope: "staff:" + account.id, key: inventoryKey("staff:" + account.id) };
  if (!value || value === "owner") return { scope: "owner", key: OWNER_KEY };
  if (!/^staff:[a-zA-Z0-9_-]{4,100}$/.test(value)) return null;
  const user = await prisma.user.findUnique({ where: { id: value.slice(6) }, select: { id: true } });
  return user ? { scope: value, key: inventoryKey(value) } : null;
}
const CATEGORIES = new Set(["Chemicals","Equipment","Towels & pads","Consumables","Other"]);
const UNITS = new Set(["each","bottles","liters","gallons","packs","pads","towels","ounces"]);
type Entry = {
 id:string; name:string; category:string; quantity:number;
 unit:string; reorderAt:number; unitCost:number; notes:string; onOrder:number; eta:string;
};
function validate(body:unknown):Entry[]|null {
 if(!Array.isArray(body)||body.length>200)return null;
 const items:Entry[]=[];
 const ids=new Set<string>();
 for(const entry of body){
  if(!entry||typeof entry!=="object")return null;
  const x=entry as Record<string,unknown>;
  const id=String(x.id??"").slice(0,90),name=String(x.name??"").trim().slice(0,140);
  if(!/^[a-z0-9-]{6,90}$/i.test(id)||ids.has(id)||!name)return null;
  ids.add(id);
  const category=String(x.category??"Other"),unit=String(x.unit??"each");
  const quantity=Number(x.quantity),reorderAt=Number(x.reorderAt),unitCost=Number(x.unitCost),onOrder=Number(x.onOrder??0);
  const eta=String(x.eta??"");
  if(!CATEGORIES.has(category)||!UNITS.has(unit))return null;
  if(![quantity,reorderAt,unitCost,onOrder].every(v=>Number.isFinite(v)&&v>=0&&v<=1000000))return null;
  if(eta&&!/^\d{4}-\d{2}-\d{2}$/.test(eta))return null;
  items.push({id,name,category,unit,quantity:Math.round(quantity*100)/100,
   reorderAt:Math.round(reorderAt*100)/100,unitCost:Math.round(unitCost*100)/100,
   notes:String(x.notes??"").slice(0,800),onOrder:Math.round(onOrder*100)/100,eta:onOrder?eta:""});
 }
 return items;
}
export async function GET(request: NextRequest) {
 const account = await getCurrentAccountFromRequest(request);
 if (!hasStaffPermission(account, "inventory") || !account)
   return NextResponse.json({ error: "Permission required" }, { status: 403 });
 const selection = await resolveScope(account, request.nextUrl.searchParams.get("scope"));
 if (!selection) return NextResponse.json({ error: "Invalid inventory owner" }, { status: 400 });
 const row = await prisma.siteContent.findUnique({
   where: { key: selection.key }, select: { value: true, updatedAt: true },
 });
 if (!row) return NextResponse.json({ items: [], version: null, scope: selection.scope },
   { headers: { "Cache-Control": "private, no-store" } });
 let items: unknown;
 try { items = JSON.parse(row.value); } catch { items = []; }
 return NextResponse.json({
   items: validate(items) || [],
   version: row.updatedAt.toISOString(),
   scope: selection.scope,
 }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function PUT(request: NextRequest) {
 const account = await getCurrentAccountFromRequest(request);
 if (!hasStaffPermission(account, "inventory") || !account)
   return NextResponse.json({ error: "Permission required" }, { status: 403 });
 const origin = request.headers.get("origin");
 if (origin && origin !== request.nextUrl.origin)
   return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
 const body = await request.json().catch(() => null);
 const selection = await resolveScope(account, body?.scope);
 if (!selection) return NextResponse.json({ error: "Invalid inventory owner" }, { status: 400 });
 const items = validate(body?.items);
 if (!items) return NextResponse.json({ error: "Invalid inventory data. Each item needs a name, valid quantity and unit." }, { status: 400 });
 const version = body?.version == null ? null : String(body.version);
 if (version !== null && Number.isNaN(Date.parse(version)))
   return NextResponse.json({ error: "Invalid version" }, { status: 400 });
 try {
   const result = await prisma.$transaction(async tx => {
     const current = await tx.siteContent.findUnique({
       where: { key: selection.key }, select: { value: true, updatedAt: true },
     });
     if ((current?.updatedAt.toISOString() || null) !== version) return { conflict: true };
     let previous: Entry[] = [];
     try { previous = validate(current ? JSON.parse(current.value) : []) || []; } catch { previous = []; }
     const nextIds = new Set(items.map(item => item.id));
     for (const removed of previous.filter(item => !nextIds.has(item.id))) {
       await archiveDeletion(tx, {
         kind: "inventory", entityId: removed.id, summary: removed.name,
         scope: selection.scope, snapshot: removed, actor: account,
       });
     }
     const saved = current
       ? await tx.siteContent.update({ where: { key: selection.key }, data: { value: JSON.stringify(items) } })
       : await tx.siteContent.create({ data: { key: selection.key, value: JSON.stringify(items) } });
     return { version: saved.updatedAt.toISOString() };
   });
   if ("conflict" in result) return NextResponse.json({ error: "Inventory changed in another tab. Refresh before saving." }, { status: 409 });
   return NextResponse.json({ ok: true, version: result.version, scope: selection.scope });
 } catch (error) {
   console.error("Inventory save failed", error);
   return NextResponse.json({ error: "Could not save inventory. Try again." }, { status: 500 });
 }
}
