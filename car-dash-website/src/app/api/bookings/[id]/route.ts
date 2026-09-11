import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentAccountFromRequest,
  isOwnerAccount,
  isStaffAccount,
} from "@/lib/permissions";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAccountFromRequest(request);

    if (!isStaffAccount(auth)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const { status } = await request.json();
    const params = await context.params;

    const booking = await prisma.booking.update({
      where: {
        id: params.id,
      },
      data: {
        status,
      },
    });

    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error("Error updating booking:", error);

    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAccountFromRequest(request);

    // Only the owner can permanently delete bookings.
    if (!isOwnerAccount(auth)) {
      return NextResponse.json(
        { error: "Owner access required" },
        { status: 403 }
      );
    }

    const params = await context.params;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Keep active requests protected from accidental deletion.
    if (!["completed", "cancelled"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Only completed or cancelled bookings can be deleted." },
        { status: 400 }
      );
    }

    await prisma.booking.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Booking deleted permanently.",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);

    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
