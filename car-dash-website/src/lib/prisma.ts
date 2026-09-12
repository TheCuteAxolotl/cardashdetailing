import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

type DatabaseCandidate = {
  name: "PRISMA_DATABASE_URL" | "POSTGRES_URL" | "DATABASE_URL";
  value: string;
};

function normalizeCandidate(
  name: DatabaseCandidate["name"],
  value: string | undefined
): DatabaseCandidate | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  // Vercel integration references that were not resolved are not real URLs.
  // Only accept protocols Prisma can actually use for PostgreSQL / Prisma Postgres.
  if (!/^(?:postgres(?:ql)?|prisma(?:\+postgres)?):\/\//i.test(trimmed)) {
    return null;
  }

  return { name, value: trimmed };
}

function chooseDatabaseUrl(): DatabaseCandidate | null {
  const candidates = [
    normalizeCandidate("DATABASE_URL", process.env.DATABASE_URL),
    normalizeCandidate("POSTGRES_URL", process.env.POSTGRES_URL),
    normalizeCandidate("PRISMA_DATABASE_URL", process.env.PRISMA_DATABASE_URL),
  ].filter((candidate): candidate is DatabaseCandidate => Boolean(candidate));

  // Prefer a pooled Prisma Postgres TCP URL whenever Vercel exposes one.
  // Prisma recommends pooled connections for normal application/serverless traffic.
  const pooled = candidates.find((candidate) => {
    if (!/^postgres(?:ql)?:\/\//i.test(candidate.value)) return false;
    try {
      const hostname = new URL(candidate.value).hostname.toLowerCase();
      return (
        hostname === "pooled.db.prisma.io" ||
        hostname.includes("pooler") ||
        hostname.includes("pooled")
      );
    } catch {
      return false;
    }
  });

  if (pooled) return pooled;

  // Otherwise prefer DATABASE_URL, which is the current Prisma/Vercel
  // Marketplace convention, then fall back to legacy variable names.
  return (
    candidates.find((candidate) => candidate.name === "DATABASE_URL") ||
    candidates.find((candidate) => candidate.name === "POSTGRES_URL") ||
    candidates.find((candidate) => candidate.name === "PRISMA_DATABASE_URL") ||
    null
  );
}

function addServerlessPoolLimits(raw: string) {
  // Prisma Postgres/Accelerate-style URLs manage pooling themselves.
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

const selectedDatabase = chooseDatabaseUrl();

export const databaseRuntimeInfo = {
  configured: Boolean(selectedDatabase),
  source: selectedDatabase?.name ?? null,
};

if (!selectedDatabase && process.env.NODE_ENV === "production") {
  console.error(
    "No usable database URL was found. Expected PRISMA_DATABASE_URL, POSTGRES_URL, or DATABASE_URL."
  );
}

const runtimeUrl = selectedDatabase
  ? addServerlessPoolLimits(selectedDatabase.value)
  : undefined;

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

// Reuse one Prisma client per warm server process. This keeps login, images,
// bookings, support and quote chat from opening unnecessary database clients.
globalForPrisma.prisma = prisma;

export default prisma;
