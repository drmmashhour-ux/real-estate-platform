/**
 * Print soft-launch readiness (same logic as GET /api/ready/soft-launch).
 *
 * Run: pnpm run validate:soft-launch-status
 *
 * Exit 1 if `ready` is false (DB / Stripe / Supabase broken).
 * Exit 1 if SOFT_LAUNCH_STRICT=1 and `softLaunchReady` is false.
 */
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env"), override: true });

async function main() {
  const { getSoftLaunchStatus } = await import("../lib/ops/soft-launch-status");
  const s = await getSoftLaunchStatus();

  console.log(JSON.stringify(s, null, 2));

  if (!s.ready) {
    console.error("\nNOT READY: fix errors above (database, Stripe, or Supabase service role).");
    process.exit(1);
  }

  if (process.env.SOFT_LAUNCH_STRICT?.trim() === "1" && !s.softLaunchReady) {
    console.error(
      "\nSTRICT MODE: softLaunchReady is false — fix warnings (webhook secret, listing count, sample quality, identity gate)."
    );
    process.exit(1);
  }

  if (!s.softLaunchReady) {
    console.warn(
      "\nWARN: Core infra OK but softLaunchReady=false — review warnings before inviting real guests."
    );
  } else {
    console.log("\nOK: softLaunchReady — run pnpm run test:bnhub:api with BNHUB_SMOKE_LISTING_ID=b1111111-1111-4111-8111-111111111101");
  }

  process.exit(0);
}

void main();
