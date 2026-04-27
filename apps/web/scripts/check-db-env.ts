/**
 * Debug: confirm DATABASE_URL is present after the same load order as Prisma CLI.
 * Run: pnpm tsx scripts/check-db-env.ts
 */
import "./load-apps-web-env";

const loaded = Boolean(process.env.DATABASE_URL?.trim());
console.log("DATABASE_URL:", loaded ? "Loaded" : "Missing");

if (!loaded) {
  process.exit(1);
}
