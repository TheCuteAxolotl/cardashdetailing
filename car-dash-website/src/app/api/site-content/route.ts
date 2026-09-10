import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthFromRequest } from "@/lib/auth";
import { OWNER_EMAIL } from "@/lib/constants";
import { SITE_DEFAULTS } from "@/lib/site-defaults";

const prisma = new PrismaClient();

function isOwner(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return false;
  return auth.role === "owner" || auth.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

export async function GET() {
  try {
    const rows = await prisma.siteContent.findMany();
    const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return NextResponse.json({ ...SITE_DEFAULTS, ...stored });
  } catch (error) {
    console.error("Error fetching site content:", error);
    return NextResponse.json(SITE_DEFAULTS);
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isOwner(request)) {
      return NextResponse.json({ error: "Owner login required" }, { status: 403 });
    }

    const body = await request.json();
    const allowedKeys = new Set(Object.keys(SITE_DEFAULTS));
    const entries = Object.entries(body).filter(([key]) => allowedKeys.has(key));

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.siteContent.upsert({
          where: { key },
          update: { value: String(value ?? "").slice(0, 1200) },
          create: { key, value: String(value ?? "").slice(0, 1200) },
        })
      )
    );

    const rows = await prisma.siteContent.findMany();
    const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return NextResponse.json({ ...SITE_DEFAULTS, ...stored });
  } catch (error) {
    console.error("Error updating site content:", error);
    return NextResponse.json({ error: "Failed to update website content" }, { status: 500 });
  }
}
