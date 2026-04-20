/**
 * Unified governance — merges region policy, approval boundary, legal + fraud/revenue risk, optional ML assist.
 * Never throws; returns conservative fallback on failure.
 */
import type { ObservationSnapshot, PolicyDecision, ProposedAction } from "../types/domain.types";
import { autonomyConfig } from "../config/autonomy.config";
import { evaluateSyriaApprovalBoundary } from "@/modules/integrations/regions/syria/syria-approval-boundary.service";
import { evaluateSyriaPreviewPolicyFromSignals } from "@/modules/integrations/regions/syria/syria-policy.service";
import type { SyriaSignal, SyriaSignalSeverity, SyriaSignalType } from "@/modules/integrations/regions/syria/syria-signal.types";
import { evaluateFraudRevenueRisk } from "./fraud-revenue-risk.service";
import { getHybridMlRiskScore } from "./hybrid-risk-adapter.service";
import { evaluateLegalRiskForGovernance } from "./legal-risk.service";
import type {
  GovernanceExplainabilityLine,
  GovernanceRuleTrace,
  UnifiedGovernanceInput,
  UnifiedGovernanceResult,
  UnifiedGovernanceDisposition,
} from "./unified-governance.types";

const SYRIA_TYPES = new Set<string>([
  "low_conversion_high_views",
  "low_booking_activity",
  "potential_fraud_pattern",
  "listing_stale",
  "payout_anomaly",
  "review_backlog",
  "inactive_listing",
]);

export function buildUnifiedGovernanceExecutionInput(params: {
  ctx: {
    dryRun: boolean;
    regionCode: string;
    listingSource?: string;
  };
  proposed: ProposedAction;
  policy: PolicyDecision;
}): UnifiedGovernanceInput {
  const { proposed, policy, ctx } = params;
  const meta =
    proposed.metadata && typeof proposed.metadata === "object"
      ? (proposed.metadata as Record<string, unknown>)
      : {};
  const revenueFacts =
    meta.revenueFacts && typeof meta.revenueFacts === "object"
      ? (meta.revenueFacts as NonNullable<UnifiedGovernanceInput["revenueFacts"]>)
      : undefined;

  const syntheticSignals: NonNullable<UnifiedGovernanceInput["signals"]> = [];
  if (proposed.risk === "HIGH") {
    syntheticSignals.push({ type: "synthetic_action_risk_high", severity: "warning" });
  }
  if (proposed.risk === "CRITICAL") {
    syntheticSignals.push({ type: "synthetic_action_risk_critical", severity: "critical" });
  }

  return {
    mode: "execution",
    regionCode: ctx.regionCode,
    listingId: proposed.target.id ?? undefined,
    actionType: proposed.type,
    entityType: proposed.target.type,
    fraudFlag: meta.fraudFlag === true,
    signals: syntheticSignals,
    revenueFacts,
    featureFlags: {
      AUTONOMY_GOVERNANCE_AUTO_EXECUTE: autonomyConfig.governanceAutoExecuteEnabled,
    },
    metadata: {
      policyDisposition: policy.disposition,
      dryRun: ctx.dryRun,
      listingSource: ctx.listingSource,
      ...meta,
    },
  };
}

function isSyriaRegion(regionCode?: string): boolean {
  const n = String(regionCode ?? "")
    .trim()
    .toLowerCase();
  return n === "sy" || n === "syria";
}

function riskLevelFromScore(score: number): UnifiedGovernanceResult["combinedRisk"]["level"] {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

const DEFAULT_COMBINED_CRITICAL = 75;
const DEFAULT_COMBINED_HIGH = 50;
const DEFAULT_COMBINED_MEDIUM = 25;

function combinedLevelFromSimulatedScore(
  score: number,
  t?: import("./unified-governance.types").PolicySimulationTuning["thresholds"],
): UnifiedGovernanceResult["combinedRisk"]["level"] {
  const mediumCut = t?.combinedRiskMedium ?? DEFAULT_COMBINED_MEDIUM;
  const highCut = t?.combinedRiskHigh ?? DEFAULT_COMBINED_HIGH;
  const criticalCut = DEFAULT_COMBINED_CRITICAL;
  if (score >= criticalCut) return "CRITICAL";
  if (score >= highCut) return "HIGH";
  if (score >= mediumCut) return "MEDIUM";
  return "LOW";
}

function scaleRevenueFactsForSensitivity(
  rf: UnifiedGovernanceInput["revenueFacts"],
  sensitivity?: number,
): UnifiedGovernanceInput["revenueFacts"] | undefined {
  if (!rf) return undefined;
  const s = sensitivity ?? 1;
  const a = rf.anomalyScore;
  if (typeof a !== "number" || !Number.isFinite(a)) return rf;
  return { ...rf, anomalyScore: Math.min(1, Math.max(0, a * s)) };
}

function isPolicySimulationSandbox(input: UnifiedGovernanceInput): boolean {
  return input.metadata?.policySimulationSandbox === true;
}

function toSyriaSignals(signals: UnifiedGovernanceInput["signals"]): SyriaSignal[] {
  const out: SyriaSignal[] = [];
  for (const s of signals ?? []) {
    if (!SYRIA_TYPES.has(s.type)) continue;
    const sev = (s.severity ?? "info") as SyriaSignalSeverity;
    const meta = s.metadata ?? {};
    const contributing: Record<string, number | string | null> = {};
    for (const [k, v] of Object.entries(meta)) {
      if (typeof v === "number") contributing[k] = v;
      else if (typeof v === "string") contributing[k] = v;
    }
    out.push({
      type: s.type as SyriaSignalType,
      severity: sev,
      message: typeof meta.message === "string" ? meta.message : "",
      contributingMetrics: contributing,
    });
  }
  return out;
}

function buildSyriaObservation(input: UnifiedGovernanceInput): ObservationSnapshot {
  const now = new Date().toISOString();
  return {
    id: `unified-gov-${input.listingId ?? "unknown"}`,
    target: { type: "syria_listing", id: input.listingId ?? null, label: undefined },
    signals: [],
    aggregates: {},
    facts: {
      fraudFlag: input.fraudFlag,
      syriaListingStatus: input.listingStatus,
      adapterDisabled: input.featureFlags?.syriaAdapterDisabled === true,
      unsupportedRegionFeature: input.featureFlags?.unsupportedRegionFeature === true,
    },
    builtAt: now,
  };
}

function safeFallback(mode: UnifiedGovernanceInput["mode"]): UnifiedGovernanceResult {
  const base: UnifiedGovernanceResult = {
    disposition: mode === "execution" ? "DRY_RUN" : "CAUTION_PREVIEW",
    allowExecution: false,
    requiresHumanApproval: true,
    blocked: false,
    legalRisk: {
      score: 35,
      level: "MEDIUM",
      reasons: ["unified_governance_safe_fallback"],
      requiresBlock: false,
      requiresApproval: true,
    },
    fraudRisk: {
      score: 25,
      level: "MEDIUM",
      reasons: ["unified_governance_safe_fallback"],
      revenueImpactEstimate: 0,
      requiresBlock: false,
      requiresApproval: false,
    },
    combinedRisk: { score: 30, level: "MEDIUM" },
    explainability: {
      summary: "Governance evaluation fell back to a cautious default — review before acting.",
      lines: [
        {
          code: "gov_fallback",
          label: "Fallback",
          detail: "Unified governance encountered an unexpected path; conservative posture applied.",
          severity: "warning",
        },
      ],
      bullets: ["Unified governance defaulted to cautious review-only posture."],
    },
    trace: [{ step: 0, ruleId: "fallback", matched: true, outcome: "safe_fallback", reason: mode }],
  };
  return base;
}

export async function evaluateUnifiedGovernance(input: UnifiedGovernanceInput): Promise<UnifiedGovernanceResult> {
  try {
    const trace: GovernanceRuleTrace[] = [];
    let step = 1;
    const sandboxActive = isPolicySimulationSandbox(input);
    const simTuning = sandboxActive ? input.policySimulation : undefined;

    let policyKey = "allow_preview";
    let approvalBoundary: UnifiedGovernanceResult["approvalBoundary"];

    if (isSyriaRegion(input.regionCode) || input.metadata?.listingSource === "syria") {
      const sySignals = toSyriaSignals(input.signals);
      const observation = buildSyriaObservation(input);
      const syPolicy = evaluateSyriaPreviewPolicyFromSignals(sySignals, observation);
      policyKey = syPolicy.decision;
      const boundary = evaluateSyriaApprovalBoundary({ policy: syPolicy });
      approvalBoundary = {
        liveExecutionBlocked: boundary.liveExecutionBlocked,
        requiresHumanApprovalHint: boundary.requiresHumanApprovalHint,
        reasons: [...boundary.reasons],
        notes: [...boundary.notes],
      };
      trace.push({
        step,
        ruleId: "syria_policy",
        matched: true,
        outcome: syPolicy.decision,
        reason: syPolicy.rationale.slice(0, 200),
      });
      step += 1;
      trace.push({
        step,
        ruleId: "syria_approval_boundary",
        matched: true,
        outcome: boundary.liveExecutionBlocked ? "live_blocked" : "live_allowed_boundary",
        reason: boundary.reasons.join("; ").slice(0, 200),
      });
      step += 1;
    } else {
      trace.push({
        step,
        ruleId: "region_policy_skip",
        matched: false,
        outcome: "non_syria",
        reason: "Syria policy path skipped",
      });
      step += 1;
    }

    const pd = policyKey;

    const legal = evaluateLegalRiskForGovernance(input);
    trace.push({
      step,
      ruleId: "legal_risk",
      matched: true,
      outcome: legal.level,
      reason: `score=${legal.score}`,
    });
    step += 1;

    const fraud = evaluateFraudRevenueRisk({
      fraudFlag: input.fraudFlag,
      signals: input.signals,
      revenueFacts: scaleRevenueFactsForSensitivity(
        input.revenueFacts,
        simTuning?.thresholds?.anomalySensitivity,
      ),
    });
    trace.push({
      step,
      ruleId: "fraud_revenue_risk",
      matched: true,
      outcome: fraud.level,
      reason: `score=${fraud.score}`,
    });
    step += 1;

    const hybrid =
      simTuning !== undefined
        ? ({ available: false as const } as const)
        : await getHybridMlRiskScore({
            entityType: input.entityType,
            actionType: input.actionType,
            regionCode: input.regionCode,
            metadata: input.metadata,
          });
    const mlBonus =
      simTuning !== undefined ? 0
      : hybrid.available && typeof hybrid.mlScore === "number" ? 15 * hybrid.mlScore
      : 0;
    trace.push({
      step,
      ruleId: "hybrid_ml",
      matched: simTuning === undefined && hybrid.available,
      outcome:
        simTuning !== undefined ? "disabled_in_sandbox"
        : hybrid.available ? String(hybrid.mlScore)
        : "unavailable",
    });
    step += 1;

    const lwRaw = simTuning?.thresholds?.legalWeight;
    const fwRaw = simTuning?.thresholds?.fraudWeight;
    let lw = 0.5;
    let fw = 0.5;
    if (typeof lwRaw === "number" && typeof fwRaw === "number") {
      const denom = lwRaw + fwRaw;
      if (denom > 0 && Number.isFinite(denom)) {
        lw = lwRaw / denom;
        fw = fwRaw / denom;
      }
    }
    const combinedScore = Math.round(Math.min(100, legal.score * lw + fraud.score * fw + mlBonus));
    const combinedRisk = {
      score: combinedScore,
      level:
        simTuning !== undefined ?
          combinedLevelFromSimulatedScore(combinedScore, simTuning.thresholds)
        : riskLevelFromScore(combinedScore),
    };
    trace.push({
      step,
      ruleId: "combined_risk",
      matched: true,
      outcome: combinedRisk.level,
      reason: `score=${combinedRisk.score}`,
    });
    step += 1;

    const pdNormalized = pd;

    let disposition: UnifiedGovernanceDisposition = "ALLOW_PREVIEW";
    let blocked = false;

    const syExecReject =
      input.mode === "execution" &&
      isSyriaRegion(input.regionCode) &&
      approvalBoundary?.liveExecutionBlocked === true;

    if (pdNormalized === "blocked_for_region") {
      blocked = true;
      disposition = input.mode === "preview" ? "BLOCKED_FOR_REGION" : "REJECTED";
    } else if (syExecReject) {
      blocked = true;
      disposition = "REJECTED";
    } else if (legal.requiresBlock || fraud.requiresBlock) {
      blocked = true;
      disposition = input.mode === "preview" ? "REQUIRES_LOCAL_APPROVAL" : "REJECTED";
    } else if (pdNormalized === "requires_local_approval") {
      disposition = input.mode === "preview" ? "REQUIRES_LOCAL_APPROVAL" : "REQUIRE_APPROVAL";
    } else if (pdNormalized === "caution_preview") {
      disposition = input.mode === "preview" ? "CAUTION_PREVIEW" : "DRY_RUN";
    } else if (combinedRisk.level === "HIGH" || combinedRisk.level === "CRITICAL") {
      disposition = input.mode === "preview" ? "REQUIRES_LOCAL_APPROVAL" : "REQUIRE_APPROVAL";
    } else if (combinedRisk.level === "MEDIUM") {
      disposition = input.mode === "preview" ? "CAUTION_PREVIEW" : "DRY_RUN";
    } else {
      disposition = input.mode === "preview" ? "ALLOW_PREVIEW" : "RECOMMEND_ONLY";
    }

    const autoExecuteFlagOn =
      autonomyConfig.governanceAutoExecuteEnabled === true &&
      input.featureFlags?.AUTONOMY_GOVERNANCE_AUTO_EXECUTE !== false;

    const autoEligible =
      input.mode === "execution" &&
      disposition === "RECOMMEND_ONLY" &&
      !blocked &&
      !legal.requiresBlock &&
      !fraud.requiresBlock &&
      !legal.requiresApproval &&
      !fraud.requiresApproval &&
      combinedRisk.level === "LOW" &&
      !isSyriaRegion(input.regionCode) &&
      autoExecuteFlagOn;

    if (autoEligible) {
      disposition = "AUTO_EXECUTE";
    }

    if (simTuning?.overrides?.forceBlockHighRisk === true) {
      if (combinedRisk.level === "HIGH" || combinedRisk.level === "CRITICAL") {
        blocked = true;
        disposition = input.mode === "preview" ? "REQUIRES_LOCAL_APPROVAL" : "REJECTED";
      }
    }

    if (simTuning?.overrides?.forceRequireApproval === true && !blocked) {
      disposition = input.mode === "preview" ? "REQUIRES_LOCAL_APPROVAL" : "REQUIRE_APPROVAL";
    }

    const allowExecution = disposition === "AUTO_EXECUTE";

    const requiresHumanApproval =
      disposition === "REQUIRE_APPROVAL" ||
      disposition === "REQUIRES_LOCAL_APPROVAL" ||
      disposition === "CAUTION_PREVIEW" ||
      disposition === "DRY_RUN";

    const lines: GovernanceExplainabilityLine[] = [];
    lines.push({
      code: "policy_decision",
      label: "Policy",
      detail: pdNormalized,
      severity: pdNormalized === "blocked_for_region" ? "critical" : "info",
    });
    if (approvalBoundary) {
      lines.push({
        code: "approval_boundary",
        label: "Approval boundary",
        detail: `liveBlocked=${approvalBoundary.liveExecutionBlocked};humanHint=${approvalBoundary.requiresHumanApprovalHint}`,
        severity: approvalBoundary.requiresHumanApprovalHint ? "warning" : "info",
      });
    }
    lines.push({
      code: "legal_risk",
      label: "Legal risk index",
      detail: `score=${legal.score};level=${legal.level}`,
      severity: legal.level === "HIGH" || legal.level === "CRITICAL" ? "warning" : "info",
    });
    lines.push({
      code: "fraud_risk",
      label: "Fraud / revenue risk",
      detail: `score=${fraud.score};level=${fraud.level};revenueImpact≈${fraud.revenueImpactEstimate}`,
      severity: fraud.level === "HIGH" || fraud.level === "CRITICAL" ? "warning" : "info",
    });
    lines.push({
      code: "combined_risk",
      label: "Combined risk",
      detail: `score=${combinedRisk.score};level=${combinedRisk.level}`,
      severity: combinedRisk.level === "HIGH" || combinedRisk.level === "CRITICAL" ? "warning" : "info",
    });
    if (input.listingDisplayId) {
      lines.push({
        code: "identity_scope",
        label: "Listing display id",
        detail: String(input.listingDisplayId).slice(0, 128),
        severity: "info",
      });
    }

    const bullets = [
      `Disposition: ${disposition}`,
      `Combined risk ${combinedRisk.level} (${combinedRisk.score}/100).`,
      sandboxActive ? "Policy simulation sandbox — ML assist disabled."
      : hybrid.available && "mlScore" in hybrid
        ? `ML assist score considered (${hybrid.mlScore}).`
        : "ML assist unavailable — deterministic scoring only.",
    ];

    const summaryParts = [
      `Unified governance → ${disposition}.`,
      `Combined risk ${combinedRisk.level} (${combinedRisk.score}).`,
    ];
    if (approvalBoundary?.liveExecutionBlocked && isSyriaRegion(input.regionCode)) {
      summaryParts.push("Syria region: live execution blocked in apps/web phase.");
    }

    return {
      disposition,
      allowExecution,
      requiresHumanApproval,
      blocked,
      policyDecision: pdNormalized,
      approvalBoundary,
      legalRisk: legal,
      fraudRisk: fraud,
      combinedRisk,
      explainability: {
        summary: summaryParts.join(" "),
        lines,
        bullets,
      },
      trace,
    };
  } catch {
    return safeFallback(input.mode);
  }
}
