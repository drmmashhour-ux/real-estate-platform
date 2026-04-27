import { config } from "dotenv";
import { join } from "node:path";
import { assertEnvSafety } from "@repo/db/env-guard";

const appRoot = process.cwd();
config({ path: join(appRoot, ".env") });
config({ path: join(appRoot, ".env.local"), override: true });

const appId = "lecipm" as const;
const rawId = process.env.APP_ID?.trim().toLowerCase();
if (rawId && rawId !== "lecipm") {
  throw new Error(`apps/web: APP_ID must be lecipm when set (got ${rawId}).`);
}

assertEnvSafety({
  appId,
  appEnv: process.env.APP_ENV || process.env.NODE_ENV,
  dbUrl: process.env.DATABASE_URL,
  demoMode: process.env.INVESTOR_DEMO_MODE === "true",
});

console.log("env:check OK (lecipm)");
