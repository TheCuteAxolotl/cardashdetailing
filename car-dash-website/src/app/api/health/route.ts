import { NextResponse } from "next/server";
import { prisma, databaseRuntimeInfo } from "@/lib/prisma";
import { twilioRuntimeInfo } from "@/lib/twilio-sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authSecretConfigured = Boolean(
    process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  );

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        ok: true,
        database: "connected",
        databaseSource: databaseRuntimeInfo.source,
        authSecretConfigured,
        ownerEmailConfigured: Boolean(
          process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL
        ),
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
        authSecretConfigured,
        ownerEmailConfigured: Boolean(
          process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL
        ),
        twilioConfigured: twilioRuntimeInfo.configured,
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
