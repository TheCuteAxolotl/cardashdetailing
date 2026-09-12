import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAccessControlSchema } from "@/lib/access-schema";
import { isStaffPermission } from "@/lib/access-control";
import { getCurrentAccountFromRequest, isOwnerAccount, resolvePermissionSnapshot } from "@/lib/permissions";
import { OWNER_EMAIL } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const current = await getCurrentAccountFromRequest(request);
    if (!isOwnerAccount(current)) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }

    await ensureAccessControlSchema();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { bookings: true, vehicles: true, quoteThreads: true, warranties: true },
        },
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            customerPhone: true,
            serviceName: true,
            vehicleYear: true,
            vehicleMake: true,
            vehicleModel: true,
            status: true,
            preferredDate: true,
            quotedPrice: true,
            createdAt: true,
          },
        },
        vehicles: {
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true,
            nickname: true,
            year: true,
            make: true,
            model: true,
            trim: true,
            vehicleType: true,
            color: true,
            createdAt: true,
          },
        },
        customRoleAssignments: {
          include: { role: true },
          orderBy: { createdAt: "asc" },
        },
        permissionOverrides: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const accounts = users.map((user) => {
      const access = resolvePermissionSnapshot({
        email: user.email,
        role: user.role,
        assignments: user.customRoleAssignments,
        overrides: user.permissionOverrides,
      });
      const latestBooking = user.bookings[0] || null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: access.role,
        protected: user.email.toLowerCase() === OWNER_EMAIL.toLowerCase(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        counts: user._count,
        phone: latestBooking?.customerPhone || null,
        latestBooking,
        recentBookings: user.bookings,
        vehicles: user.vehicles,
        customRoles: access.customRoles,
        overrides: Object.fromEntries(
          user.permissionOverrides
            .filter((item) => isStaffPermission(item.permission))
            .map((item) => [item.permission, item.allowed ? "allow" : "deny"])
        ),
        effectivePermissions: access.permissions,
        staffAccess: access.staffAccess,
      };
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Load account directory error:", error);
    return NextResponse.json({ error: "Could not load accounts" }, { status: 500 });
  }
}
