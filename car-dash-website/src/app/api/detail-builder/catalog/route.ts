import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/invoices";
import {
  DEFAULT_DETAIL_BUILDER_CATALOG,
  parseDetailBuilderCatalog,
  sanitizeDetailBuilderCatalog,
} from "@/lib/detail-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "owner:detail-builder-catalog";

export async function GET() {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }
    const row = await prisma.siteContent.findUnique({ where: { key: KEY } });
    const catalog = row ? parseDetailBuilderCatalog(row.value) : DEFAULT_DETAIL_BUILDER_CATALOG;
    return NextResponse.json({ catalog });
  } catch (error) {
    console.error("Detail builder catalog read error:", error);
    return NextResponse.json({ error: "Could not load detail builder pricing" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await requireOwner())) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const catalog = sanitizeDetailBuilderCatalog(body?.catalog);
    await prisma.siteContent.upsert({
      where: { key: KEY },
      create: { key: KEY, value: JSON.stringify(catalog) },
      update: { value: JSON.stringify(catalog) },
    });
    return NextResponse.json({ catalog });
  } catch (error) {
    console.error("Detail builder catalog update error:", error);
    return NextResponse.json({ error: "Could not save detail builder pricing" }, { status: 500 });
  }
}
