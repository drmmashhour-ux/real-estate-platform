/**
 * Warns when DATABASE_URL does not point at a local Postgres instance.
 * Does not print the connection string or any secrets.
 */
import { isLocalDatabaseUrl, resolveDatabaseUrl } from "./db-url-utils";

function main(): void {
  const dbUrl = resolveDatabaseUrl();

  if (!dbUrl) {
    console.warn("[db:check] DATABASE_URL is not set (checked process.env and apps/web/.env).");
    process.exit(0);
    return;
  }

  if (!isLocalDatabaseUrl(dbUrl)) {
    console.warn("\n⚠️ You are using a remote DB. This is unsafe for development.\n");
  } else {
    console.log("[db:check] DATABASE_URL points to a local host (localhost / 127.0.0.1). OK for safe dev.");
  }

  if (process.env.DB_CHECK_STRICT === "1" && !isLocalDatabaseUrl(dbUrl)) {
    console.error("[db:check] DB_CHECK_STRICT=1: refusing to continue with a non-local database.");
    process.exit(1);
  }
}

main();
