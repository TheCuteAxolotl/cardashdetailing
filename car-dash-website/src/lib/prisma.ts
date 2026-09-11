import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getRuntimeDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;

  // On serverless deployments, a small per-instance pool helps prevent the
  // database from being exhausted when several API routes run at once.
  // Leave Prisma Accelerate / Prisma Postgres protocol URLs untouched.
  if (!/^postgres(?:ql)?:\/\//i.test(raw)) return raw;

  try {
    const url = new URL(raw);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const runtimeUrl = getRuntimeDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(runtimeUrl
      ? {
          datasources: {
            db: { url: runtimeUrl },
          },
        }
      : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

// Reuse one client for the lifetime of a warm server process in every
// environment. This is especially important on Vercel/serverless.
globalForPrisma.prisma = prisma;

export default prisma;
