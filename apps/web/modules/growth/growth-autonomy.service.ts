/**
 * Autonomy orchestrator — gathers enforcement snapshot + catalog, resolves mode/dispositions, returns readable snapshot.
 * Does not execute payments, bookings, ads core, CRO core, or external sends.
 */

import { growthAutonomyFlags, growthPolicyEnforcementFlags } from "@/config/feature-flags";
import { GROWTH_AUTONOMY_CATALOG, type GrowthAutonomyCatalogEntry } from "./growth-autonomy-catalog";
import { parseGrowthAutonomyModeFromEnv, parseGrowthAutonomyRolloutFromEnv } from "./growth-autonomy-config";
import { buildAutonomyExplanation } from "./growth-autonomy-explanation.service";
import { recordGrowthAutonomySnapshotBuild } from "./growth-autonomy-monitoring.service";
import type {
  GrowthAutonomyDisposition,
  GrowthAutonomyMode,
  GrowthAutonomyPrefill,
  GrowthAutonomySnapshot,
  GrowthAutonomySuggestion,
} from "./growth-autonomy.types";
import { getEnforcementForTarget } from "./growth-policy-enforcement-query.service";
import { buildGrowthPolicyEnforcementSnapshot } from "./growth-policy-enforcement.service";
import type { GrowthEnforcementMode, GrowthPolicyEnforcementSnapshot } from "./growth-policy-enforcement.types";

function ts(): string {
  return new Date().toISOString();
}

const SCOPE_EXCLUSIONS = [
  "Payments and billing",
  "Booking core and checkout",
  "Ads execution core",
  "CRO core rendering and experiments",
  "Unsafe external messaging / auto-send",
  "Risky live pricing or inventory mutations",
] as const;

function confidenceFor(args: { enforcementAvailable: boolean; snapshotPartial: boolean }): number {
  if (!args.enforcementAvailable) return 0.42;
  if (args.snapshotPartial) return 0.55;
  return 0.72;
}

function resolveDisposition(
  autonomyMode: GrowthAutonomyMode,
  enfMode: GrowthEnforcementMode,
  surfaceInDebug: boolean,
): GrowthAutonomyDisposition {
  if (autonomyMode === "OFF") {
    // Policy-critical outcomes stay visible even when autonomy is OFF — never bury block/freeze/review.
    if (enfMode === "block" || enfMode === "freeze") return "blocked";
    if (enfMode === "approval_required") return "approval_required";
    return surfaceInDebug ? "suggest_only" : "hidden";
  }

  switch (enfMode) {
    case "block":
    case "freeze":
      return "blocked";
    case "approval_required":
      return "approval_required";
    case "advisory_only":
      return "suggest_only";
    case "allow":
      if (autonomyMode === "SAFE_AUTOPILOT") return "prefilled_action";
      return "suggest_only";
    default:
      return "suggest_only";
  }
}

function prefillFor(entry: GrowthAutonomyCatalogEntry, growthBasePath: string): GrowthAutonomyPrefill | undefined {
  const withFocus = (focus: string): GrowthAutonomyPrefill => ({
    kind: "navigate_path",
    label: `Open: ${entry.label}`,
    href: `${growthBasePath}?growthAutonomyFocus=${encodeURIComponent(focus)}`,
  });

  switch (entry.id) {
    case "cat-strategy-promo":
      return withFocus("strategy");
    case "cat-content":
      return withFocus("content");
    case "cat-messaging":
      return withFocus("messaging");
    case "cat-fusion":
      return withFocus("fusion");
    case "cat-simulation":
      return withFocus("simulation");
    case "cat-prefill":
      return {
        kind: "copy_text",
        label: "Copy growth dashboard path",
        copyText: growthBasePath,
      };
    case "cat-manual-review":
      return {
        kind: "navigate_path",
        label: "Open Growth Machine — manual review focus",
        href: `${growthBasePath}?growthAutonomyFocus=${encodeURIComponent("review")}`,
      };
    default:
      return undefined;
  }
}

function enforcementDecisionFor(
  entry: GrowthAutonomyCatalogEntry,
  snapshot: GrowthPolicyEnforcementSnapshot | null,
): { mode: GrowthEnforcementMode; rationale: string } {
  if (snapshot) {
    const d = getEnforcementForTarget(entry.enforcementTarget, snapshot);
    return { mode: d.mode, rationale: d.rationale };
  }
  if (!growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
    return {
      mode: "advisory_only",
      rationale: "Policy enforcement layer is disabled — autonomy suggestions are not policy-gated.",
    };
  }
  return {
    mode: "advisory_only",
    rationale: "Enforcement snapshot unavailable — treat suggestions as incomplete.",
  };
}

export type BuildGrowthAutonomyContext = {
  /** Full path to growth dashboard, e.g. `/en/ca/dashboard/growth` */
  growthDashboardPath: string;
  /** When true, OFF mode still surfaces suggestions for internal/debug validation (API-controlled). */
  surfaceDebug: boolean;
};

export async function buildGrowthAutonomySnapshot(ctx: BuildGrowthAutonomyContext): Promise<GrowthAutonomySnapshot> {
  const rolloutStage = parseGrowthAutonomyRolloutFromEnv();
  const configuredMode = parseGrowthAutonomyModeFromEnv();
  const killSwitch = growthAutonomyFlags.growthAutonomyKillSwitch;

  const baseOut = (partial: Partial<GrowthAutonomySnapshot>): GrowthAutonomySnapshot => ({
    autonomyLayerEnabled: false,
    autonomyMode: "OFF",
    rolloutStage,
    killSwitchActive: killSwitch,
    enforcementSnapshotPresent: false,
    enforcementLayerFlagOn: growthPolicyEnforcementFlags.growthPolicyEnforcementV1,
    enforcementInputPartial: false,
    suggestions: [],
    counts: { surfaced: 0, blocked: 0, approvalRequired: 0, hidden: 0, prefilled: 0 },
    operatorNotes: [],
    scopeExclusions: [...SCOPE_EXCLUSIONS],
    createdAt: ts(),
    ...partial,
  });

  if (killSwitch) {
    return baseOut({
      autonomyLayerEnabled: false,
      autonomyMode: "OFF",
      operatorNotes: [
        "Kill switch active (FEATURE_GROWTH_AUTONOMY_KILL_SWITCH). Autonomy surfaces are suppressed; dashboard behavior is unchanged.",
      ],
    });
  }

  if (!growthAutonomyFlags.growthAutonomyV1) {
    return baseOut({
      autonomyLayerEnabled: false,
      autonomyMode: "OFF",
      operatorNotes: [
        "Growth autonomy layer is disabled (FEATURE_GROWTH_AUTONOMY_V1). Enable when ready for staged rollout.",
      ],
    });
  }

  if (rolloutStage === "off") {
    return baseOut({
      autonomyLayerEnabled: false,
      autonomyMode: configuredMode,
      operatorNotes: [
        "Rollout stage is off (FEATURE_GROWTH_AUTONOMY_ROLLOUT=off). Set to internal, partial, or full for staged visibility.",
      ],
    });
  }

  let enforcementSnapshot: GrowthPolicyEnforcementSnapshot | null = null;
  if (growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
    enforcementSnapshot = await buildGrowthPolicyEnforcementSnapshot();
  }

  const enforcementSnapshotPresent = enforcementSnapshot !== null;
  const enforcementInputPartial = enforcementSnapshot?.inputCompleteness === "partial";
  const enforcementAvailable = enforcementSnapshotPresent;

  const autonomyMode: GrowthAutonomyMode = configuredMode;

  const suggestions: GrowthAutonomySuggestion[] = [];
  let surfaced = 0;
  let blocked = 0;
  let approvalRequired = 0;
  let hidden = 0;
  let prefilled = 0;

  const operatorNotes: string[] = [];
  if (!growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
    operatorNotes.push(
      "Policy enforcement is off — autonomy operates without enforcement gates. Prefer enabling FEATURE_GROWTH_POLICY_ENFORCEMENT_V1 before SAFE_AUTOPILOT in production.",
    );
  }
  if (enforcementInputPartial) {
    operatorNotes.push("Partial enforcement inputs — autonomy conclusions are directional, not definitive.");
  }

  for (const entry of GROWTH_AUTONOMY_CATALOG) {
    const enf = enforcementDecisionFor(entry, enforcementSnapshot);
    const disposition = resolveDisposition(autonomyMode, enf.mode, ctx.surfaceDebug);

    const explanation = buildAutonomyExplanation({
      autonomyMode,
      disposition,
      enforcementMode: enf.mode,
      enforcementAvailable,
      snapshotPartial: enforcementInputPartial,
      label: entry.label,
      whyInCatalog: entry.whyInCatalog,
      actionType: entry.actionType,
    });

    const confidence = confidenceFor({ enforcementAvailable, snapshotPartial: enforcementInputPartial });

    let prefill: GrowthAutonomyPrefill | undefined;
    if (disposition === "prefilled_action" && autonomyMode === "SAFE_AUTOPILOT") {
      prefill = prefillFor(entry, ctx.growthDashboardPath);
    }

    const allowed = disposition !== "blocked" && disposition !== "hidden";

    const suggestion: GrowthAutonomySuggestion = {
      id: entry.id,
      actionType: entry.actionType,
      label: entry.label,
      targetKey: entry.enforcementTarget,
      explanation,
      confidence,
      enforcementTargetMode: enf.mode,
      enforcementTargetKey: entry.enforcementTarget,
      disposition,
      allowed,
      policyNote: enf.rationale,
      prefill,
    };

    suggestions.push(suggestion);

    if (disposition === "hidden") hidden += 1;
    else if (disposition === "blocked") blocked += 1;
    else if (disposition === "approval_required") approvalRequired += 1;
    else {
      surfaced += 1;
      if (disposition === "prefilled_action") prefilled += 1;
    }
  }

  recordGrowthAutonomySnapshotBuild({
    surfaced,
    blocked,
    approvalRequired,
    hidden,
    partialSnapshot: enforcementInputPartial,
  });

  return {
    autonomyLayerEnabled: true,
    autonomyMode,
    rolloutStage,
    killSwitchActive: false,
    enforcementSnapshotPresent,
    enforcementLayerFlagOn: growthPolicyEnforcementFlags.growthPolicyEnforcementV1,
    enforcementInputPartial,
    suggestions,
    counts: {
      surfaced,
      blocked,
      approvalRequired,
      hidden,
      prefilled,
    },
    operatorNotes,
    scopeExclusions: [...SCOPE_EXCLUSIONS],
    createdAt: ts(),
  };
}
