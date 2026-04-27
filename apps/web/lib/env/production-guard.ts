/**
 * Fail fast in production if DATABASE_URL points at a local DB or is not a recognized managed host.
 * Does not log the URL (no secrets in stdout).
 */
export function assertProductionEnvSafety(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl.trim()) {
    return;
  }

  const u = dbUrl.toLowerCase();
  if (u.includes("localhost") || u.includes("127.0.0.1")) {
    throw new Error("❌ PRODUCTION USING LOCAL DATABASE");
  }

  const looksCloud =
    u.includes("neon") ||
    u.includes("supabase") ||
    u.includes("pooler") ||
    u.includes("rds.amazonaws.com") ||
    u.includes("amazonaws.com") ||
    u.includes("cockroach");

  if (!looksCloud) {
    throw new Error("❌ PRODUCTION DATABASE NOT RECOGNIZED");
  }
}
