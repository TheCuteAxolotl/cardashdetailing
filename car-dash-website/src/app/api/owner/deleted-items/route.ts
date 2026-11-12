import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deletedKey, listDeletionHistory, parseDeletedRecord } from "@/lib/deletion-history";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import { parseTeams, TEAMS_KEY } from "@/lib/detailer-teams";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isOwnerAccount(await getCurrentAccountFromRequest(request)))
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  const history = await listDeletionHistory();
  return NextResponse.json({
    history: history.map(({ snapshot, ...record }) => record),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const actor = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(actor) || !actor)
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const id = String(body?.id || "");
  if (!/^[a-f0-9-]{36}$/.test(id))
    return NextResponse.json({ error: "Invalid history record." }, { status: 400 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.siteContent.findUnique({ where: { key: deletedKey(id) } });
      const record = row ? parseDeletedRecord(row.value) : null;
      if (!record) return { error: "Deletion record not found.", status: 404 };
      if (record.restoredAt) return { error: "This record was already restored.", status: 409 };

      if (record.kind === "invoice") {
        const key = "invoice:" + record.entityId;
        if (await tx.siteContent.findUnique({ where: { key } }))
          return { error: "An active invoice with this ID already exists.", status: 409 };
        await tx.siteContent.create({ data: { key, value: JSON.stringify(record.snapshot) } });
      } else if (record.kind === "inventory") {
        const scope = record.scope;
        if (scope !== "owner" && !/^staff:[a-zA-Z0-9_-]{4,100}$/.test(scope))
          return { error: "Invalid inventory owner.", status: 400 };
        const key = scope === "owner" ? "owner:supplies-inventory:v1"
          : "detailer:supplies-inventory:v1:" + scope.slice(6);
        const current = await tx.siteContent.findUnique({ where: { key } });
        let items: Array<{id:string;name:string}> = [];
        try { items = current ? JSON.parse(current.value) : []; } catch { items = []; }
        if (!Array.isArray(items) || items.length >= 200 || items.some(item => item.id === record.entityId))
          return { error: "Supply already exists or inventory is full. Review it before restoring.", status: 409 };
        const snapshot = record.snapshot as { id?: string; name?: string };
        if (snapshot?.id !== record.entityId || !snapshot.name)
          return { error: "Archived supply is invalid.", status: 409 };
        const value = JSON.stringify([...items, snapshot]);
        if (current) await tx.siteContent.update({ where: { key }, data: { value } });
        else await tx.siteContent.create({ data: { key, value } });
      } else if (record.kind === "team") {
        const current = await tx.siteContent.findUnique({ where: { key: TEAMS_KEY } });
        let teams = [];
        try { teams = parseTeams(current ? JSON.parse(current.value) : []); } catch { teams = []; }
        const snapshot = record.snapshot as { id?: string; name?: string; memberIds?: string[] };
        if (snapshot?.id !== record.entityId || !snapshot.name || !Array.isArray(snapshot.memberIds) ||
            teams.some(team => team.id === record.entityId))
          return { error: "Team already exists or archived data is invalid.", status: 409 };
        const members = new Set(snapshot.memberIds);
        const value = JSON.stringify([
          ...teams.map(team => ({ ...team, memberIds: team.memberIds.filter(member => !members.has(member)) })),
          snapshot,
        ]);
        if (current) await tx.siteContent.update({ where: { key: TEAMS_KEY }, data: { value } });
        else await tx.siteContent.create({ data: { key: TEAMS_KEY, value } });
      }

      record.restoredAt = new Date().toISOString();
      record.restoredById = actor.id;
      record.restoredByName = actor.name;
      await tx.siteContent.update({
        where: { key: deletedKey(record.id) }, data: { value: JSON.stringify(record) },
      });
      return { ok: true };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Recover deleted item failed", error);
    return NextResponse.json({ error: "Could not restore deleted item." }, { status: 500 });
  }
}
