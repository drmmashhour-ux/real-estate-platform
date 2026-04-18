/**
 * LECIPM Full Platform Validation System v1 — CLI entry.
 *
 * Usage (from apps/web):
 *   pnpm validate:platform
 *
 * Env:
 *   VALIDATION_BASE_URL — default http://127.0.0.1:3001
 *   VALIDATION_PAGE_MODE=smoke|full — default smoke (full walks all discovered example URLs; slow)
 *   VALIDATION_OFFLINE=1 — skip HTTP checks (discovery + launch events + reports only)
 *   DATABASE_URL — required for launch_events gate
 *   VALIDATION_RUN_STRIPE_E2E=1 — run BNHub Stripe script (needs server + Stripe test keys)
 *   VALIDATION_SKIP_DATA_INTEGRITY=1 — skip Supabase booking integrity
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "./load-apps-web-env";
import { executePlatformValidationV1 } from "../modules/validation/platform-validation-runner.service";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const report = await executePlatformValidationV1({ writeReports: true });

  console.log(`[validation] Route map: ${report.routeMapSummary.totalDiscovered} pages → tests/reports/route-map.json`);

  console.log("\n--- LECIPM Full Platform Validation v1 ---");
  console.log(`Decision: ${report.launch.decision}`);
  console.log(`Reports: tests/reports/final-validation-report.json`);
  if (report.launch.blockers.length) {
    console.log("\nBlockers:");
    for (const b of report.launch.blockers) console.log(`  - ${b}`);
  }

  process.exit(report.launch.decision === "NO_GO" ? 1 : 0);
}

void main().catch((e) => {
  console.error("[validation] fatal:", e);
  process.exit(1);
});
