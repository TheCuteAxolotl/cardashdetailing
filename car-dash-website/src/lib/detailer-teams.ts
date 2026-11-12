import { prisma } from "@/lib/prisma";

export const TEAMS_KEY = "owner:detailer-teams:v1";
export type DetailerTeam = {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
};

export function parseTeams(input: unknown): DetailerTeam[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is DetailerTeam =>
    !!item && typeof item.id === "string" && typeof item.name === "string" &&
    Array.isArray(item.memberIds) && typeof item.createdAt === "string")
    .map((item) => ({
      id: item.id, name: item.name, description: item.description || "",
      memberIds: item.memberIds.filter((id): id is string => typeof id === "string"),
      createdAt: item.createdAt, updatedAt: item.updatedAt || item.createdAt,
    }));
}

export async function readTeams() {
  const row = await prisma.siteContent.findUnique({ where: { key: TEAMS_KEY } });
  let teams: DetailerTeam[] = [];
  if (row) {
    try { teams = parseTeams(JSON.parse(row.value)); } catch { teams = []; }
  }
  return { teams, version: row?.updatedAt.toISOString() || null };
}
