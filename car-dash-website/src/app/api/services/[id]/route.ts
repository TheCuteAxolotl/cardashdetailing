import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { OWNER_EMAIL } from "@/lib/constants";

function isOwner(request: NextRequest) {
  const auth = getAuthFromRequest(request);

  if (!auth) {
    return false;
  }

  return (
    auth.role === "owner" ||
    auth.email.toLowerCase() === OWNER_EMAIL.toLowerCase()
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(service, { status: 200 });
  } catch (error) {
    console.error("Error fetching service:", error);

    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isOwner(request)) {
      return NextResponse.json(
        { error: "Owner login required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const price = Number(body.price);

    if (
      !title ||
      !description ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Title, description, and a valid price are required",
        },
        { status: 400 }
      );
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        title,
        description,
        price,
        image: null,
      },
    });

    return NextResponse.json(service, { status: 200 });
  } catch (error) {
    console.error("Error updating service:", error);

    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isOwner(request)) {
      return NextResponse.json(
        { error: "Owner login required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Service deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting service:", error);

    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
