import { logInfo } from "@/lib/logger";
import type { ConfidenceTier, DecisionRecommendation } from "@/modules/investor/investor.types";
import type { InvestorListingContext } from "@/modules/investor/investor-context.loader";

const DF_TAG = "[investor-decision-frame]";
import { buildAcquisitionSummary } from "@/modules/investor/investor-acquisition-summary.engine";
import { buildRiskStructuredSummary } from "@/modules/investor/investor-risk-summary.engine";
import { confidenceFromEsg } from "@/modules/investor/investor-esg-summary.engine";

export type DecisionFrameResult = {
  recommendation: DecisionRecommendation;
  confidenceLevel: ConfidenceTier;
  rationale: string;
  proceedConditions: string[];
  noGoTriggers: string[];
  /** Traceability strings for auditors */
  sourceSignals: string[];
};

function tierRank(c: ConfidenceTier): number {
  switch (c) {
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 1;
    default:
      return 0;
  }
}

/**
 * Conservative, rules-first mapping from structured inputs — no fabricated economics.
 */
export function frameInvestmentDecision(ctx: InvestorListingContext): DecisionFrameResult {
  const risks = buildRiskStructuredSummary(ctx);
  const acq = buildAcquisitionSummary(ctx);
  const esgConf = confidenceFromEsg(ctx);

  const critical = risks.criticalRisks.length;
  const high = risks.highRisks.length;
  const blockingActions = ctx.esgActionsOpen.filter((a) => a.status === "BLOCKED").length;

  const sourceSignals: string[] = [];
  sourceSignals.push(`ESG evidence confidence tier: ${esgConf}`);
  sourceSignals.push(`Acquisition screen status (derived): ${acq.screenStatus}`);
  sourceSignals.push(`Open ESG actions (tracked): ${ctx.esgActionsOpen.length}`);
  if (critical > 0) sourceSignals.push(`Critical risk bucket count: ${critical}`);

  const noGoTriggers: string[] = [];
  if (critical > 0) noGoTriggers.push("Unresolved governance / compliance blockers flagged in structured data.");
  if (blockingActions > 0) noGoTriggers.push("Blocked execution items remain open in Action Center.");
  if (acq.screenStatus === "FAIL") noGoTriggers.push("Acquisition screening tagged FAIL — do not advance without mandate reset.");

  const proceedConditions: string[] = [];
  if (esgConf !== "HIGH") proceedConditions.push("Upgrade verified utility / disclosure evidence to strengthen confidence.");
  if ((ctx.esgProfile?.dataCoveragePercent ?? 0) < 55) proceedConditions.push("Raise ESG data coverage via document ingestion above internal threshold.");
  if (acq.screenStatus === "CONDITIONAL") proceedConditions.push("Confirm underwriting assumptions against acquisition opportunity model (estimated).");

  let recommendation: DecisionRecommendation = "HOLD";
  let confidenceLevel: ConfidenceTier = esgConf === "UNKNOWN" ? "LOW" : esgConf;

  if (critical === 0 && blockingActions === 0 && acq.screenStatus !== "FAIL") {
    if (tierRank(esgConf) >= 2 && acq.screenStatus === "PASS" && high <= 2) {
      recommendation = "PROCEED";
      confidenceLevel = esgConf;
    } else if (acq.screenStatus === "CONDITIONAL" || high > 2 || tierRank(esgConf) < 2) {
      recommendation = "PROCEED_WITH_CONDITIONS";
      confidenceLevel =
        tierRank(esgConf) <= 1 ? "LOW"
        : esgConf === "HIGH" ?
          "MEDIUM"
        : esgConf;
    }
  }

  if (critical > 0 || acq.screenStatus === "FAIL") {
    recommendation = critical >= 2 || acq.screenStatus === "FAIL" ? "DECLINE" : "PROCEED_WITH_CONDITIONS";
    confidenceLevel = "LOW";
  }

  if (ctx.esgProfile == null && ctx.investmentOpportunity == null) {
    recommendation = "HOLD";
    confidenceLevel = "LOW";
    proceedConditions.push("Populate ESG profile and/or acquisition snapshot — insufficient structured evidence.");
  }

  logInfo(`${DF_TAG}`, {
    listingId: ctx.listingId,
    recommendation,
    confidenceLevel,
    criticalCount: critical,
    acquisitionScreen: acq.screenStatus,
  });

  const rationale =
    recommendation === "PROCEED" ?
      "Structured signals suggest manageable gaps: acquisition screen not failing, no critical compliance blockers in platform data, and evidence confidence is at least moderate."
    : recommendation === "PROCEED_WITH_CONDITIONS" ?
      "Proceed with conditions: the asset shows promise in available records, but material evidence, execution, or screening conditions must be cleared before final approval."
    : recommendation === "HOLD" ?
      "Hold: investor confidence remains limited by incomplete evidence, screening ambiguity, or unresolved diligence items."
    : "Decline / no-go at this stage: severe unresolved red flags or failing screening posture based on structured inputs.";

  return {
    recommendation,
    confidenceLevel,
    rationale,
    proceedConditions: [...new Set(proceedConditions)].slice(0, 8),
    noGoTriggers: [...new Set(noGoTriggers)].slice(0, 8),
    sourceSignals,
  };
}

/** Guardrail: cannot recommend bare PROCEED when critical risks exist without explicit conditions */
export function reconcileProceedGuard(
  rec: DecisionRecommendation,
  criticalRiskCount: number
): DecisionRecommendation {
  if (rec === "PROCEED" && criticalRiskCount > 0) return "PROCEED_WITH_CONDITIONS";
  return rec;
}
