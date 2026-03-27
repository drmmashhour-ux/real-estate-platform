/**
 * Blocks dangerous Prisma CLI operations in production or against remote DB (when DEV_SAFE_MODE=true).
 * Usage: npx tsx scripts/prisma-destructive-guard.ts <migrate-reset|db-push>
 * Exit 0 = allowed to proceed (caller runs prisma after this).
 */
import { isLocalDatabaseUrl, resolveDatabaseUrl } from "./db-url-utils";

type DestructiveCommand = "migrate-reset" | "db-push";

function main(): void {
  const cmd = (process.argv[2] || "").toLowerCase() as DestructiveCommand;
  if (cmd !== "migrate-reset" && cmd !== "db-push") {
    console.error("[prisma-guard] Unknown command. Use: migrate-reset | db-push");
    process.exit(1);
    return;
  }

  const nodeEnv = process.env.NODE_ENV || "";
  if (nodeEnv === "production") {
    console.error(
      `[prisma-guard] Blocked: prisma ${cmd === "migrate-reset" ? "migrate reset" : "db push"} is not allowed when NODE_ENV=production.`,
    );
    process.exit(1);
    return;
  }

  const dbUrl = resolveDatabaseUrl();
  const remote = Boolean(dbUrl && !isLocalDatabaseUrl(dbUrl));

  if (process.env.DEV_SAFE_MODE === "true" && remote && cmd === "migrate-reset") {
    console.warn(
      "[prisma-guard] DEV_SAFE_MODE=true: blocked prisma migrate reset — DATABASE_URL is not a local host.",
    );
    process.exit(1);
    return;
  }

  process.exit(0);
}

main();
