import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCallSystemSchema } from "@/lib/call-system";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!isOwnerAccount(auth)) {
      return NextResponse.json({ error: "Owner access required." }, { status: 403 });
    }

    await ensureCallSystemSchema();
    const { id } = await context.params;
    await prisma.blockedCaller.deleteMany({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unblock caller failed:", error);
    return NextResponse.json({ error: "Could not unblock that caller." }, { status: 500 });
  }
}
