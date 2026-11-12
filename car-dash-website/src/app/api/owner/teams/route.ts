import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { archiveDeletion } from "@/lib/deletion-history";
import { TEAMS_KEY, parseTeams, readTeams, type DetailerTeam } from "@/lib/detailer-teams";
import { getCurrentAccountFromRequest, getPermissionSnapshotForUser, isOwnerAccount } from "@/lib/permissions";

export const dynamic = "force-dynamic";

async function owner(request: NextRequest, mutate = false) {
  const account = await getCurrentAccountFromRequest(request);
  if (!isOwnerAccount(account) || !account) return null;
  if (mutate && request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return null;
  return account;
}

export async function GET(request: NextRequest) {
  if (!(await owner(request))) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const result = await readTeams();
  return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const actor = await owner(request, true);
  if (!actor) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const name = String(body?.name || "").trim().slice(0, 100);
  const description = String(body?.description || "").trim().slice(0, 500);
  const members = body?.memberIds;
  if (!name || !Array.isArray(members) || members.length > 40 ||
      members.some((v: unknown) => typeof v !== "string" || v.length > 100))
    return NextResponse.json({ error: "Enter a team name and valid detailers." }, { status: 400 });
  const memberIds = [...new Set(members as string[])];
  if (memberIds.length) {
    const users = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, email: true, role: true, name: true },
    });
    const eligible = await Promise.all(users.map(async (user) => ({
      id: user.id,
      permitted: (await getPermissionSnapshotForUser(user)).permissions.includes("assignedJobs") &&
        (await getPermissionSnapshotForUser(user)).role !== "owner",
    })));
    if (eligible.length !== memberIds.length || eligible.some(item => !item.permitted))
      return NextResponse.json({ error: "Select only active accounts with Assigned Jobs permission." }, { status: 400 });
  }

  const version = body?.version == null ? null : String(body.version);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.siteContent.findUnique({ where: { key: TEAMS_KEY } });
      if ((row?.updatedAt.toISOString() || null) !== version) return { conflict: true };
      let teams: DetailerTeam[] = [];
      try { teams = parseTeams(row ? JSON.parse(row.value) : []); } catch { teams = []; }
      if (teams.some(team => team.name.toLowerCase() === name.toLowerCase() && team.id !== id))
        return { duplicate: true };
      const existing = id ? teams.find(team => team.id === id) : null;
      if (id && !existing) return { notFound: true };
      const now = new Date().toISOString();
      const updated: DetailerTeam = {
        id: existing?.id || randomUUID(), name, description, memberIds,
        createdAt: existing?.createdAt || now, updatedAt: now,
      };
      // Each detailer belongs to at most one team. Moving them removes old team membership.
      teams = teams.map(team => ({
        ...team,
        memberIds: team.id === updated.id ? memberIds : team.memberIds.filter(userId => !memberIds.includes(userId)),
      }));
      if (!existing) teams.push(updated);
      const saved = row
        ? await tx.siteContent.update({ where: { key: TEAMS_KEY }, data: { value: JSON.stringify(teams) } })
        : await tx.siteContent.create({ data: { key: TEAMS_KEY, value: JSON.stringify(teams) } });
      return { team: updated, version: saved.updatedAt.toISOString() };
    });
    if ("conflict" in result) return NextResponse.json({ error: "Teams changed in another tab. Reload and retry." }, { status: 409 });
    if ("duplicate" in result) return NextResponse.json({ error: "A team with that name already exists." }, { status: 409 });
    if ("notFound" in result) return NextResponse.json({ error: "Team not found." }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Saving detailer team failed", error);
    return NextResponse.json({ error: "Could not save team." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const actor = await owner(request, true);
  if (!actor) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const id = String(body?.id || "");
  const version = body?.version == null ? null : String(body.version);
  if (!id) return NextResponse.json({ error: "Choose a team." }, { status: 400 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.siteContent.findUnique({ where: { key: TEAMS_KEY } });
      if ((row?.updatedAt.toISOString() || null) !== version) return { conflict: true };
      let teams: DetailerTeam[] = [];
      try { teams = parseTeams(row ? JSON.parse(row.value) : []); } catch { teams = []; }
      const removed = teams.find(team => team.id === id);
      if (!removed) return { notFound: true };
      await archiveDeletion(tx, {
        kind: "team", entityId: id, summary: removed.name, scope: "company",
        snapshot: removed, actor,
      });
      const saved = await tx.siteContent.update({
        where: { key: TEAMS_KEY },
        data: { value: JSON.stringify(teams.filter(team => team.id !== id)) },
      });
      return { version: saved.updatedAt.toISOString() };
    });
    if ("conflict" in result) return NextResponse.json({ error: "Teams changed. Reload and retry." }, { status: 409 });
    if ("notFound" in result) return NextResponse.json({ error: "Team not found." }, { status: 404 });
    return NextResponse.json({ ok: true, version: result.version });
  } catch (error) {
    console.error("Deleting detailer team failed", error);
    return NextResponse.json({ error: "Could not delete team." }, { status: 500 });
  }
}
