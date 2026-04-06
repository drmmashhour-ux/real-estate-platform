import type { Page } from "@playwright/test";
import type { ScenarioContext, ScenarioResult, SharedE2EState } from "../scenarios/_context";
import { getOrigin } from "../scenarios/_context";
import { scenario1OnlineBooking } from "../scenarios/scenario-1-online-booking";
import { scenario2SyriaManual } from "../scenarios/scenario-2-syria-manual";
import { scenario3ArabicRtl } from "../scenarios/scenario-3-arabic-rtl";
import { scenario4French } from "../scenarios/scenario-4-french";
import { scenario5HostListing } from "../scenarios/scenario-5-host-listing";
import { scenario6AiRecommendations } from "../scenarios/scenario-6-ai";
import { scenario7AdminPayment } from "../scenarios/scenario-7-admin-payment";
import { scenario8Cancel } from "../scenarios/scenario-8-cancel";
import { scenario9Error } from "../scenarios/scenario-9-error";
import { scenario10Mixed } from "../scenarios/scenario-10-mixed";
import type { E2EFailureType } from "./types";

const RUNNERS: Array<(ctx: ScenarioContext) => Promise<ScenarioResult>> = [
  scenario1OnlineBooking,
  scenario2SyriaManual,
  scenario3ArabicRtl,
  scenario4French,
  scenario5HostListing,
  scenario6AiRecommendations,
  scenario7AdminPayment,
  scenario8Cancel,
  scenario9Error,
  scenario10Mixed,
];

export const SCENARIO_SLUGS = [
  "scenario-1-online-booking",
  "scenario-2-syria-manual",
  "scenario-3-arabic-rtl",
  "scenario-4-french",
  "scenario-5-host-listing",
  "scenario-6-ai",
  "scenario-7-admin-payment",
  "scenario-8-cancel",
  "scenario-9-error",
  "scenario-10-mixed",
] as const;

export type ScenarioSlug = (typeof SCENARIO_SLUGS)[number];

export function slugForScenarioId(id: number): ScenarioSlug | null {
  if (id < 1 || id > SCENARIO_SLUGS.length) return null;
  return SCENARIO_SLUGS[id - 1]!;
}

/** Non-destructive or easily isolated scenarios are safer to auto-rerun. */
export function isRerunRecommendedForFailureType(t: E2EFailureType): boolean {
  if (t === "infra_blocked" || t === "unknown") return false;
  if (t === "db_consistency" || t === "stripe_webhook") return false;
  return true;
}

/**
 * Re-execute a single scenario with a fresh `SharedE2EState` (does not reset DB).
 * Use after env/market restore and optional seed cleanup.
 */
export async function rerunScenarioWithFreshData(page: Page, scenarioName: ScenarioSlug): Promise<ScenarioResult> {
  const idx = SCENARIO_SLUGS.indexOf(scenarioName);
  if (idx < 0) {
    return {
      id: -1,
      name: scenarioName,
      status: "FAIL",
      detail: "Unknown scenario slug",
      failedSteps: ["invalid_slug"],
      criticalBugs: [],
    };
  }
  const fn = RUNNERS[idx];
  const state: SharedE2EState = {};
  const ctx: ScenarioContext = { page, origin: getOrigin(), state };
  return fn(ctx);
}

export async function runSingleScenarioById(page: Page, scenarioId: number): Promise<ScenarioResult | null> {
  const slug = slugForScenarioId(scenarioId);
  if (!slug) return null;
  return rerunScenarioWithFreshData(page, slug);
}
