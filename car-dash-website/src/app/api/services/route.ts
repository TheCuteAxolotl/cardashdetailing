import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthFromRequest } from "@/lib/auth";
import { OWNER_EMAIL } from "@/lib/constants";

const prisma = new PrismaClient();

function isOwner(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return false;
  return auth.role === "owner" || auth.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

export async function GET() {
  try {
    const services = await prisma.service.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json(services, { status: 200 });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isOwner(request)) {
      return NextResponse.json({ error: "Owner login required" }, { status: 403 });
    }

    const body = await request.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const price = Number(body.price);

    if (!title || !description || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Title, description, and a valid price are required" }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: { title, description, price, image: null },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
