import { config } from "dotenv";
import { join } from "node:path";
import { assertEnvSafety } from "@repo/db/env-guard";

const appRoot = process.cwd();
config({ path: join(appRoot, ".env") });
config({ path: join(appRoot, ".env.local"), override: true });

const appId = "syria" as const;
const rawId = process.env.APP_ID?.trim().toLowerCase();
if (rawId && rawId !== "syria") {
  throw new Error(`apps/syria: APP_ID must be syria when set (got ${rawId}).`);
}

const syriaUrl = process.env.SYRIA_DATABASE_URL?.trim();
const dbUrl = process.env.DATABASE_URL?.trim();
if (syriaUrl && dbUrl && syriaUrl !== dbUrl) {
  throw new Error("apps/syria: When both are set, SYRIA_DATABASE_URL must match DATABASE_URL (Prisma uses DATABASE_URL).");
}

assertEnvSafety({
  appId,
  appEnv: process.env.APP_ENV || process.env.NODE_ENV,
  dbUrl: process.env.DATABASE_URL,
  demoMode: process.env.INVESTOR_DEMO_MODE === "true",
});

console.log("env:check OK (syria)");
