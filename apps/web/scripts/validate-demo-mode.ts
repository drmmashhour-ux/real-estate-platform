/**
 * Validate investor demo mode wiring (no browser).
 * Run: DEMO_MODE_ENABLED=1 pnpm validate:demo  (from apps/web)
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "../.env") });

process.env.DEMO_MODE_ENABLED = process.env.DEMO_MODE_ENABLED ?? "1";

const ROOT = path.join(__dirname, "..");

const ROUTE_FILES = [
  "app/demo/layout.tsx",
  "app/demo/page.tsx",
  "app/demo/search/page.tsx",
  "app/demo/property/[id]/page.tsx",
  "app/demo/contact/page.tsx",
  "app/demo/booking/page.tsx",
  "app/demo/ops/page.tsx",
  "app/demo/metrics/page.tsx",
];

const MODULE_FILES = [
  "src/modules/demo/demoConfig.ts",
  "src/modules/demo/demoGuard.ts",
  "src/modules/demo/demoIds.ts",
  "src/modules/demo/demoDataService.ts",
  "src/modules/demo/demoScriptService.ts",
  "src/modules/demo/demoSafety.ts",
];

async function main() {
  // eslint-disable-next-line no-console
  console.log("--- Investor demo validation ---\n");

  // 1) Routes exist
  const missing = ROUTE_FILES.filter((f) => !fs.existsSync(path.join(ROOT, f)));
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error("Missing route files:", missing);
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log("Routes OK:", ROUTE_FILES.length, "pages");

  for (const f of MODULE_FILES) {
    if (!fs.existsSync(path.join(ROOT, f))) {
      // eslint-disable-next-line no-console
      console.error("Missing module:", f);
      process.exit(1);
    }
  }

  const { readDemoModeEnabled, readUseSeededDemoDataFlag, DEMO_STEP_ORDER } = await import(
    "../src/modules/demo/demoConfig"
  );
  const enabled = readDemoModeEnabled();
  const seededFlag = readUseSeededDemoDataFlag();
  // eslint-disable-next-line no-console
  console.log("Demo mode enabled (env):", enabled);
  // eslint-disable-next-line no-console
  console.log("Use seeded data flag:", seededFlag);

  const { getDemoStepScript, getShortTalkingPoints, getNextStep } = await import(
    "../src/modules/demo/demoScriptService"
  );

  for (const step of [
    "search",
    "property",
    "contact",
    "booking",
    "ops",
    "revenue",
  ] as const) {
    const s = getDemoStepScript(step);
    const tp = getShortTalkingPoints(step);
    if (!s || tp.length === 0) {
      // eslint-disable-next-line no-console
      console.error("Script missing for", step);
      process.exit(1);
    }
  }
  // eslint-disable-next-line no-console
  console.log("Script service OK for steps:", DEMO_STEP_ORDER.join(", "));

  const {
    getDemoFeaturedListings,
    getDemoMetricsSnapshot,
    getDemoBookingPreview,
    getDemoPropertyByRouteId,
  } = await import("../src/modules/demo/demoDataService");
  const { INVESTOR_DEMO_IDS } = await import("../src/modules/demo/demoIds");

  const featured = await getDemoFeaturedListings();
  const metrics = await getDemoMetricsSnapshot();
  const booking = await getDemoBookingPreview();

  const bnProp = await getDemoPropertyByRouteId("bnhub");
  const reProp = await getDemoPropertyByRouteId("resale");
  if (!bnProp || !reProp) {
    // eslint-disable-next-line no-console
    console.error("Locked property routes bnhub/resale must resolve");
    process.exit(1);
  }

  if (featured.source !== "database") {
    // eslint-disable-next-line no-console
    console.warn("WARN: Investor demo listings not in DB — run pnpm seed:demo:investor for LST-INVDEMO1/2.");
  } else if (!featured.bnhub.badges.includes(INVESTOR_DEMO_IDS.BNHUB_LISTING_CODE)) {
    // eslint-disable-next-line no-console
    console.warn("WARN: BNHub demo card missing expected listing code badge.");
  }

  // eslint-disable-next-line no-console
  console.log("\nData source mode:", featured.source, "| seeded flag:", seededFlag);
  // eslint-disable-next-line no-console
  console.log("Sample BNHub card:", featured.bnhub.title, "|", featured.bnhub.priceLabel);
  // eslint-disable-next-line no-console
  console.log("Sample resale card:", featured.resale.title, "|", featured.resale.priceLabel);
  // eslint-disable-next-line no-console
  console.log("Metrics:", metrics.bookingsCount, "bookings,", metrics.inquiriesCount, "leads");
  // eslint-disable-next-line no-console
  console.log("Booking preview total:", booking.total, "| record:", booking.bookingRecord.status);

  const { DEMO_LIVE_PATH_ORDER } = await import("../src/modules/demo/demoConfig");
  // eslint-disable-next-line no-console
  console.log("\nLive demo path order:", DEMO_LIVE_PATH_ORDER.join(" → "));
  // eslint-disable-next-line no-console
  console.log("Locked property URLs: /demo/property/bnhub, /demo/property/resale (seeded ids only).");
  // eslint-disable-next-line no-console
  console.log("Next from search:", getNextStep("search"));

  // eslint-disable-next-line no-console
  console.log("\nLECIPM INVESTOR DEMO MODE ACTIVE");
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
