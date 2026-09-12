import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";

export async function GET() {
  try {
    const services = await prisma.service.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!hasStaffPermission(auth, "services")) return NextResponse.json({ error: "Services dashboard access required" }, { status: 403 });
    const body = await request.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const pricingType = String(body.pricingType || "fixed");
    const price = Number(body.price || 0);
    const startingPrice = body.startingPrice === "" || body.startingPrice == null ? null : Number(body.startingPrice);
    const maxPrice = body.maxPrice === "" || body.maxPrice == null ? null : Number(body.maxPrice);
    if (!title || !description) return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    const service = await prisma.service.create({ data: {
      title, description, pricingType, price: Number.isFinite(price) ? price : 0,
      startingPrice: Number.isFinite(startingPrice) ? startingPrice : null,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
      category: String(body.category || "Car Detailing").trim(),
      subcategory: String(body.subcategory || "General").trim(),
      active: body.active !== false,
      sortOrder: Number(body.sortOrder || 0), image: null,
    }});
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
