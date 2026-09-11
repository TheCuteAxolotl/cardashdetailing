import { NextResponse } from "next/server";
import { prisma, databaseRuntimeInfo } from "@/lib/prisma";
import { twilioRuntimeInfo } from "@/lib/twilio-sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function configuredOwnerEmail() {
  return (
    process.env.OWNER_EMAIL ||
    process.env.NEXT_PUBLIC_OWNER_EMAIL ||
    ""
  )
    .trim()
    .toLowerCase();
}

export async function GET() {
  const authSecretConfigured = Boolean(
    process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  );
  const ownerEmail = configuredOwnerEmail();
  const ownerEmailConfigured = Boolean(ownerEmail);
  const ownerRecoveryConfigured = Boolean(
    ownerEmail && process.env.OWNER_PASSWORD
  );

  try {
    await prisma.$queryRaw`SELECT 1`;

    // Verify that the actual auth table is usable, not just that PostgreSQL
    // accepts a connection. This catches an empty/wrong schema immediately.
    await prisma.user.findFirst({ select: { id: true } });

    const ownerAccount = ownerEmail
      ? await prisma.user.findFirst({
          where: {
            email: {
              equals: ownerEmail,
              mode: "insensitive",
            },
          },
          select: { id: true },
        })
      : null;

    return NextResponse.json(
      {
        ok: true,
        database: "connected",
        databaseSource: databaseRuntimeInfo.source,
        userTable: "ready",
        authSecretConfigured,
        ownerEmailConfigured,
        ownerAccountExists: ownerEmailConfigured ? Boolean(ownerAccount) : null,
        ownerRecoveryConfigured,
        twilioConfigured: twilioRuntimeInfo.configured,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Health check database error:", error);

    return NextResponse.json(
      {
        ok: false,
        database: databaseRuntimeInfo.configured
          ? "connection_failed"
          : "not_configured",
        databaseSource: databaseRuntimeInfo.source,
        userTable: "unavailable",
        authSecretConfigured,
        ownerEmailConfigured,
        ownerAccountExists: null,
        ownerRecoveryConfigured,
        twilioConfigured: twilioRuntimeInfo.configured,
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
