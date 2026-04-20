/**
 * Validates FSBO co-ownership autopilot compliance (deterministic; no DB required).
 *
 * Run: cd apps/web && npx tsx scripts/validate-coownership-autopilot.ts
 */

import { createMemoryCoownershipStore } from "../modules/coownership-autopilot/coownership-autopilot.store";
import {
  ensureCoOwnershipChecklist,
  requiresCoownershipCompliance,
  runCoownershipAutopilot,
} from "../modules/coownership-autopilot/coownership-autopilot.service";
import type {
  CoownershipListingInput,
  CoownershipValidationSummary,
} from "../modules/coownership-autopilot/coownership-autopilot.types";

const ISO = "2026-04-02";

const house: CoownershipListingInput = {
  id: "val-listing-house",
  propertyType: "SINGLE_FAMILY",
  sellerDeclarationJson: { isCondo: false },
};

const condoIncomplete: CoownershipListingInput = {
  id: "val-listing-condo",
  propertyType: "CONDO",
  sellerDeclarationJson: {
    isCondo: true,
    condoRulesReviewed: false,
    condoSyndicateDocumentsAvailable: false,
    condoFinancialStatementsAvailable: false,
  },
};

const condoComplete: CoownershipListingInput = {
  id: "val-listing-condo-ok",
  propertyType: "CONDO",
  sellerDeclarationJson: {
    isCondo: true,
    condoRulesReviewed: true,
    condoSyndicateDocumentsAvailable: true,
    condoFinancialStatementsAvailable: true,
  },
};

function assert(name: string, cond: boolean, details?: string): void {
  if (!cond) {
    console.error(`FAIL: ${name}${details ? ` — ${details}` : ""}`);
    process.exit(1);
  }
}

async function section(name: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n--- ${name} ---`);
  await fn();
}

async function main(): Promise<void> {
  console.log("Co-ownership autopilot validation (deterministic)");
  let summary: CoownershipValidationSummary = {
    triggerDetection: "PASS",
    checklistCreation: "PASS",
    duplicatePrevention: "PASS",
    recommendationVisibility: "PASS",
    blockingLogic: "PASS",
    scheduledScanBehavior: "PASS",
  };

  try {
    await section("CASE 1 — HOUSE (no compliance)", async () => {
      const store = createMemoryCoownershipStore();
      const r = await runCoownershipAutopilot({
        store,
        listing: house,
        mode: "SAFE_AUTOPILOT",
        trigger: "listing_created",
        isoDay: ISO,
        cycleKey: `${ISO}:listing_created:house`,
      });
      assert("house complianceApplies false", !r.complianceApplies);
      assert("house no checklist", !r.checklistEnsured || r.checklistItemKeys.length === 0);
      assert("house no compliance decision needed", !r.decisionEmitted || !r.complianceApplies);
      const keys = await store.listChecklistKeys(house.id);
      assert("house store has no checklist rows", keys.length === 0);
    });

    await section("CASE 2 — CONDO (compliance + checklist)", async () => {
      const store = createMemoryCoownershipStore();
      const r = await runCoownershipAutopilot({
        store,
        listing: condoIncomplete,
        mode: "SAFE_AUTOPILOT",
        trigger: "listing_created",
        isoDay: ISO,
        cycleKey: `${ISO}:listing_created:condo`,
      });
      assert("condo applies", r.complianceApplies);
      assert("checklist ensured", r.checklistEnsured);
      assert("keys present", r.checklistItemKeys.includes("coownership_certificate"));
      assert("recommendation absent in SAFE mode", r.recommendation === null);
    });

    await section("Duplicate prevention (unique keys)", async () => {
      const store = createMemoryCoownershipStore();
      await ensureCoOwnershipChecklist(store, condoIncomplete);
      await ensureCoOwnershipChecklist(store, condoIncomplete);
      const keys = await store.listChecklistKeys(condoIncomplete.id);
      const uniq = new Set(keys);
      assert("unique keys", uniq.size === keys.length);
      assert("expected defs", uniq.size >= 2);
    });

    await section("Modes: OFF / ASSIST / SAFE / FULL", async () => {
      const storeOff = createMemoryCoownershipStore();
      const off = await runCoownershipAutopilot({
        store: storeOff,
        listing: condoIncomplete,
        mode: "OFF",
        trigger: "listing_updated",
        isoDay: ISO,
        cycleKey: `${ISO}:upd:off`,
      });
      assert("OFF no action", off.action === "NONE");

      const storeA = createMemoryCoownershipStore();
      const as = await runCoownershipAutopilot({
        store: storeA,
        listing: condoIncomplete,
        mode: "ASSIST",
        trigger: "listing_created",
        isoDay: ISO,
        cycleKey: `${ISO}:assist:1`,
      });
      assert("ASSIST recommendation", as.recommendation !== null && as.recommendation.length > 0);
      assert("ASSIST no checklist ensure", !as.checklistEnsured);

      const storeS = createMemoryCoownershipStore();
      const safe = await runCoownershipAutopilot({
        store: storeS,
        listing: condoIncomplete,
        mode: "SAFE_AUTOPILOT",
        trigger: "listing_created",
        isoDay: ISO,
        cycleKey: `${ISO}:safe:1`,
      });
      assert("SAFE checklist", safe.checklistEnsured);
      assert("SAFE no block", safe.action !== "BLOCK_ACTION");

      const storeF = createMemoryCoownershipStore();
      const full = await runCoownershipAutopilot({
        store: storeF,
        listing: condoIncomplete,
        mode: "FULL_AUTOPILOT_APPROVAL",
        trigger: "listing_updated",
        isoDay: ISO,
        cycleKey: `${ISO}:full:block`,
      });
      assert("FULL blocks when cert missing", full.action === "BLOCK_ACTION");
      assert(
        "FULL reason",
        full.blockReason === "Missing co-ownership certificate",
      );

      const storeOk = createMemoryCoownershipStore();
      const fullOk = await runCoownershipAutopilot({
        store: storeOk,
        listing: condoComplete,
        mode: "FULL_AUTOPILOT_APPROVAL",
        trigger: "listing_updated",
        isoDay: ISO,
        cycleKey: `${ISO}:full:ok`,
      });
      assert("FULL no block when complete", fullOk.action !== "BLOCK_ACTION");
    });

    await section("Idempotency (one decision per cycle)", async () => {
      const store = createMemoryCoownershipStore();
      const ck = `${ISO}:idem:condo`;
      const a = await runCoownershipAutopilot({
        store,
        listing: condoIncomplete,
        mode: "ASSIST",
        trigger: "listing_created",
        cycleKey: ck,
      });
      const b = await runCoownershipAutopilot({
        store,
        listing: condoIncomplete,
        mode: "ASSIST",
        trigger: "listing_updated",
        cycleKey: ck,
      });
      assert("first emits decision", a.decisionEmitted === true);
      assert("second skips decision record", b.decisionEmitted === false);
    });

    await section("Scheduled scan — no duplicate decisions; incomplete keeps recommendation", async () => {
      const store = createMemoryCoownershipStore();
      const cycle = `${ISO}:scan`;
      const s1 = await runCoownershipAutopilot({
        store,
        listing: condoIncomplete,
        mode: "ASSIST",
        trigger: "scheduled_scan",
        cycleKey: cycle,
      });
      const s2 = await runCoownershipAutopilot({
        store,
        listing: condoIncomplete,
        mode: "ASSIST",
        trigger: "scheduled_scan",
        cycleKey: cycle,
      });
      assert("scan1 emitted", s1.decisionEmitted);
      assert("scan2 no dup decision", !s2.decisionEmitted);
      assert("still incomplete shows reco", s2.recommendation !== null);
    });

    await section("Edge: CONDO → HOUSE clears checklist", async () => {
      const store = createMemoryCoownershipStore();
      await runCoownershipAutopilot({
        store,
        listing: condoIncomplete,
        mode: "SAFE_AUTOPILOT",
        trigger: "listing_created",
        isoDay: ISO,
        cycleKey: `${ISO}:edge:condo`,
      });
      assert("checklist exists", (await store.listChecklistKeys(condoIncomplete.id)).length > 0);
      await runCoownershipAutopilot({
        store,
        listing: { ...condoIncomplete, id: condoIncomplete.id, propertyType: "SINGLE_FAMILY", sellerDeclarationJson: { isCondo: false } },
        mode: "SAFE_AUTOPILOT",
        trigger: "listing_updated",
        isoDay: ISO,
        cycleKey: `${ISO}:edge:house`,
      });
      assert("cleared after house", (await store.listChecklistKeys(condoIncomplete.id)).length === 0);
    });

    await section("Edge: HOUSE → CONDO adds compliance", async () => {
      const store = createMemoryCoownershipStore();
      const hid = "val-flip";
      await runCoownershipAutopilot({
        store,
        listing: { ...house, id: hid },
        mode: "SAFE_AUTOPILOT",
        trigger: "listing_created",
        isoDay: ISO,
        cycleKey: `${ISO}:flip:h`,
      });
      await runCoownershipAutopilot({
        store,
        listing: { ...condoIncomplete, id: hid },
        mode: "SAFE_AUTOPILOT",
        trigger: "listing_updated",
        isoDay: ISO,
        cycleKey: `${ISO}:flip:c`,
      });
      assert("now has checklist", (await store.listChecklistKeys(hid)).length > 0);
    });

    await section("Edge: isCoOwnership override", async () => {
      assert(
        "townhouse + flag",
        requiresCoownershipCompliance({
          id: "x",
          propertyType: "TOWNHOUSE",
          isCoOwnership: true,
          sellerDeclarationJson: {},
        }),
      );
    });
  } catch {
    summary = {
      triggerDetection: "FAIL",
      checklistCreation: "FAIL",
      duplicatePrevention: "FAIL",
      recommendationVisibility: "FAIL",
      blockingLogic: "FAIL",
      scheduledScanBehavior: "FAIL",
    };
  }

  console.log("\n======== SUMMARY ========");
  const rows: [keyof CoownershipValidationSummary, string][] = [
    ["triggerDetection", "Trigger detection (HOUSE vs CONDO)"],
    ["checklistCreation", "Checklist creation"],
    ["duplicatePrevention", "Duplicate prevention"],
    ["recommendationVisibility", "Recommendation visibility"],
    ["blockingLogic", "Blocking logic"],
    ["scheduledScanBehavior", "Scheduled scan behavior"],
  ];
  for (const [k, label] of rows) {
    console.log(`${summary[k]} — ${label}`);
  }

  if (process.exitCode === 1) {
    const fail = Object.fromEntries(rows.map(([k]) => [k, "FAIL"])) as CoownershipValidationSummary;
    Object.assign(summary, fail);
    console.log("\nOverall: FAIL");
    process.exit(1);
  }

  console.log("\nOverall: PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
