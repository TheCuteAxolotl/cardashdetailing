export function isLikelyDatabaseError(error: unknown) {
  const candidate = error as { code?: string; message?: string } | null;
  const code = String(candidate?.code || "");
  const message = String(candidate?.message || error || "");

  return (
    /^P10\d\d$/.test(code) ||
    code === "P2024" ||
    /database|datasource|connection|connect|pool|too many connections|environment variable/i.test(
      message
    )
  );
}

export function databaseUnavailableResponseMessage() {
  return "The database is temporarily unavailable. Please try again shortly.";
}
