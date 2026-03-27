/**
 * CLI entry for LECIPM system validation (integration + load probe).
 *
 *   cd apps/web
 *   cp .env.example .env  # ensure DATABASE_URL + SYSTEM_VALIDATION_USER_PASSWORD
 *   TEST_MODE=true SYSTEM_VALIDATION_USER_PASSWORD='YourLongPasswordHere!' npm run test:system-validation
 *
 * Optional: SKIP_SCALING=1 for faster runs.
 */
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "../.env") });

process.env.TEST_MODE = "true";

async function main() {
  const { runFullSystemTest } = await import("@/src/modules/system-validation/runFullSystemTest");
  const skipScaling = process.env.SKIP_SCALING === "1" || process.env.SKIP_SCALING === "true";
  const report = await runFullSystemTest({ skipScaling });
  const ok = report.flows.every((f) => f.ok);
  console.log(JSON.stringify({ ok, flowsOk: report.flows.filter((f) => f.ok).length, total: report.flows.length }, null, 2));
  if (!ok) {
    console.error("Some flows failed — see report.recommendations and .system-validation/last-report.json");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
