import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, hasStaffPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!hasStaffPermission(auth, "warranties")) {
      return NextResponse.json({ error: "Warranty dashboard access required" }, { status: 403 });
    }

    const vehicles = await prisma.vehicle.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      vehicles.map((vehicle) => ({
        id: vehicle.id,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        vehicleType: vehicle.vehicleType,
        userId: vehicle.userId,
        customerName: vehicle.user.name,
        customerEmail: vehicle.user.email,
      }))
    );
  } catch (error) {
    console.error("Load warranty vehicle directory error:", error);
    return NextResponse.json({ error: "Could not load customer vehicles" }, { status: 500 });
  }
}
