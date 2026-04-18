import { randomUUID } from "crypto";
import type { ScalingRecommendation } from "@/modules/ads/ads-scaling-recommendations.service";
import type { BudgetReallocationRecommendation } from "@/modules/growth/portfolio-optimization.types";
import type { ProfitRecommendation } from "@/modules/growth/profit-engine.types";
import type { ProposedAction } from "@/modules/ai-autopilot/ai-autopilot.types";
import { clampScore, normalizeConfidenceLabel } from "./confidence-normalizer.service";
import type { AssistantRecommendation, OperatorActionType, RecommendationSource } from "./operator.types";

function baseRec(
  source: RecommendationSource,
  actionType: OperatorActionType,
  input: Omit<AssistantRecommendation, "id" | "source" | "actionType" | "confidenceLabel" | "createdAt"> & {
    confidenceScore: number;
  },
): AssistantRecommendation {
  return {
    id: randomUUID(),
    source,
    actionType,
    confidenceLabel: normalizeConfidenceLabel(input.confidenceScore),
    createdAt: new Date().toISOString(),
    ...input,
  };
}

const scalingActionMap: Record<ScalingRecommendation["action"], OperatorActionType> = {
  increase_budget: "SCALE_CAMPAIGN",
  duplicate_ad_set: "TEST_NEW_VARIANT",
  pause: "PAUSE_CAMPAIGN",
  hold: "MONITOR",
};

const profitActionMap: Record<ProfitRecommendation["action"], OperatorActionType> = {
  SCALE: "SCALE_CAMPAIGN",
  PAUSE: "PAUSE_CAMPAIGN",
  FIX_FUNNEL: "TEST_NEW_VARIANT",
  MONITOR: "MONITOR",
};

export function mapAdsRecommendations(rows: ScalingRecommendation[]): AssistantRecommendation[] {
  return rows.map((r) => {
    const actionType = scalingActionMap[r.action] ?? "MONITOR";
    const conf =
      r.confidence === "high" ? 0.78 : r.confidence === "medium" ? 0.62 : 0.45;
    return baseRec("ADS", actionType, {
      targetId: r.campaignKey ?? null,
      targetLabel: r.campaignKey ?? null,
      title: `Ads: ${r.action.replace(/_/g, " ")}${r.campaignKey ? ` — ${r.campaignKey}` : ""}`,
      summary: r.reason,
      reason: r.detail ? `${r.reason} ${r.detail}` : r.reason,
      confidenceScore: clampScore(conf),
      evidenceScore: null,
      evidenceQuality: r.confidence === "high" ? "HIGH" : r.confidence === "medium" ? "MEDIUM" : "LOW",
      expectedImpact: "Visibility and conversion if changes are applied manually in ad platforms.",
      operatorAction:
        "Manual review in Meta/Google Ads Manager only — LECIPM does not change budgets or creatives.",
      blockers: [],
      warnings: ["Attribution is partial; confirm with platform metrics before spending."],
      // V2: SCALE_CAMPAIGN / PAUSE_CAMPAIGN map to external budget sync actions in operator-budget-prep (not new actionTypes).
      metrics: { campaignKey: r.campaignKey ?? null, scalingAction: r.action },
    });
  });
}

export function mapPortfolioBudgetReallocations(rows: BudgetReallocationRecommendation[]): AssistantRecommendation[] {
  return rows.map((r) =>
    baseRec("PORTFOLIO", "MONITOR", {
      targetId: r.toCampaignKey ?? null,
      targetLabel: r.fromCampaignKey && r.toCampaignKey ? `${r.fromCampaignKey} → ${r.toCampaignKey}` : null,
      title: `Portfolio: reallocate budget (${r.fromCampaignKey ?? "—"} → ${r.toCampaignKey ?? "—"})`,
      summary: r.reason,
      reason: `${r.reason} Suggested shift ~$${r.amount.toFixed(2)} (window-estimated attributed spend). ${r.safeguards.join(" ")}`,
      confidenceScore: clampScore(r.confidenceScore),
      evidenceScore: r.confidenceScore,
      evidenceQuality: r.confidenceScore >= 0.7 ? "HIGH" : r.confidenceScore >= 0.55 ? "MEDIUM" : "LOW",
      expectedImpact: "Improved portfolio efficiency if manual budget changes match platform reality.",
      operatorAction: "Adjust budgets only in Meta/Google Ads Manager — LECIPM never writes ad platform budgets.",
      blockers: [],
      warnings: ["LTV is estimated from booking signals; confirm attribution before moving spend."],
      metrics: {
        portfolioReallocation: true,
        fromCampaignKey: r.fromCampaignKey,
        toCampaignKey: r.toCampaignKey,
        amount: r.amount,
      },
    }),
  );
}

export function mapProfitRecommendations(rows: ProfitRecommendation[]): AssistantRecommendation[] {
  return rows.map((p) => {
    const actionType = profitActionMap[p.action] ?? "MONITOR";
    return baseRec("PROFIT", actionType, {
      targetId: p.campaignId,
      targetLabel: p.campaignId,
      title: `Profit: ${p.action.replace(/_/g, " ")} — ${p.campaignId}`,
      summary: p.reason,
      reason: `Profit engine signal with confidence ${(p.confidence * 100).toFixed(0)}%. LTV is estimated until wired to realized revenue.`,
      confidenceScore: clampScore(p.confidence),
      evidenceScore: p.confidence,
      evidenceQuality: p.confidence >= 0.7 ? "HIGH" : p.confidence >= 0.5 ? "MEDIUM" : "LOW",
      expectedImpact: "Unit economics improvement if CPL and LTV assumptions hold.",
      operatorAction: "Validate LTV with finance; adjust bids/budget only manually in external tools.",
      blockers: [],
      warnings: ["LTV uses heuristic defaults when booking revenue is not aggregated."],
      // V2: profit SCALE/PAUSE uses same Operator action strings; external layer applies prep/guardrails only when flagged.
      metrics: { campaignId: p.campaignId, profitAction: p.action },
    });
  });
}

export function mapCroRecommendations(input: {
  preferredPrimaryCta: string | null;
  weakCtAs: string[];
}): AssistantRecommendation[] {
  if (!input.preferredPrimaryCta) return [];
  return [
    baseRec("CRO", "UPDATE_CTA_PRIORITY", {
      targetId: "bnhub_listing_hero",
      targetLabel: "BNHub listing hero CTA",
      title: "CRO: prioritize primary CTA from unified learning",
      summary: `Suggested primary: “${input.preferredPrimaryCta}”.`,
      reason: "Unified learning merged AB/CRO/ads signals toward this CTA variant.",
      confidenceScore: 0.58,
      evidenceScore: 0.55,
      evidenceQuality: "MEDIUM",
      expectedImpact: "Higher click-through on listing hero when copy aligns with experiments.",
      operatorAction: "Apply copy in CMS or feature flag; no automatic publish.",
      blockers: [],
      warnings:
        input.weakCtAs.includes(input.preferredPrimaryCta) ?
          ["Preferred CTA also appears in weak list — human review recommended."]
        : [],
      metrics: { preferredPrimaryCta: input.preferredPrimaryCta },
    }),
  ];
}

export function mapRetargetingRecommendations(actions: ProposedAction[]): AssistantRecommendation[] {
  return actions.map((a) =>
    baseRec("RETARGETING", "UPDATE_RETARGETING_MESSAGE_PRIORITY", {
      targetId: a.entityId,
      targetLabel: a.title,
      title: a.title,
      summary: a.summary,
      reason: typeof a.reasons?.confidence === "number" ? `Autopilot confidence ${a.reasons.confidence}` : a.summary,
      confidenceScore: clampScore(
        typeof a.reasons?.confidence === "number" ? (a.reasons.confidence as number) : 0.5,
      ),
      evidenceScore: typeof a.reasons?.confidence === "number" ? (a.reasons.confidence as number) : null,
      evidenceQuality: "MEDIUM",
      expectedImpact: "Better retargeting relevance when messages are updated manually.",
      operatorAction: a.summary,
      blockers: [],
      warnings: ["No API send — paste creatives in ad platforms manually."],
      metrics: { domain: a.domain, actionType: a.actionType },
    }),
  );
}

export function mapAbDecisions(actions: ProposedAction[]): AssistantRecommendation[] {
  return actions.map((a) => {
    let op: OperatorActionType = "MONITOR";
    const at = String(a.actionType);
    if (at.includes("promote") || at.includes("winner")) op = "PROMOTE_EXPERIMENT_WINNER";
    else if (at.includes("variant") || at.includes("iterate")) op = "TEST_NEW_VARIANT";
    else if (at.includes("create")) op = "TEST_NEW_VARIANT";
    return baseRec("AB_TEST", op, {
      targetId: a.entityId,
      targetLabel: a.title,
      title: a.title,
      summary: a.summary,
      reason: a.summary,
      confidenceScore: clampScore(typeof a.reasons?.confidence === "number" ? (a.reasons.confidence as number) : 0.48),
      evidenceScore: typeof a.reasons?.confidence === "number" ? (a.reasons.confidence as number) : null,
      evidenceQuality: "MEDIUM",
      expectedImpact: "Measured lift when experiment outcomes are promoted through your process.",
      operatorAction: "Use experiment tooling; promotion is manual and approval-gated.",
      blockers: [],
      warnings: [],
      metrics: { actionType: a.actionType },
    });
  });
}

export function mapMarketplaceDecisions(
  rows: Array<{
    id: string;
    listingId: string | null;
    decisionType: string;
    reason: string;
    confidence: number;
    priority: string;
  }>,
): AssistantRecommendation[] {
  return rows.map((row) => {
    const mapType = (t: string): OperatorActionType => {
      switch (t) {
        case "BOOST_LISTING":
          return "BOOST_LISTING";
        case "DOWNRANK_LISTING":
          return "DOWNRANK_LISTING";
        case "REVIEW_LISTING":
        case "FLAG_FOR_FRAUD_REVIEW":
          return "REVIEW_LISTING";
        case "RECOMMEND_PRICE_CHANGE":
          return "RECOMMEND_PRICE_CHANGE";
        case "QUALITY_IMPROVEMENT_RECOMMENDED":
          return "QUALITY_IMPROVEMENT";
        default:
          return "MONITOR";
      }
    };
    const actionType = mapType(row.decisionType);
    return baseRec("MARKETPLACE", actionType, {
      targetId: row.listingId,
      targetLabel: row.listingId,
      title: `Marketplace: ${row.decisionType.replace(/_/g, " ")}`,
      summary: row.reason,
      reason: `Logged decision ${row.id} · priority ${row.priority}.`,
      confidenceScore: clampScore(row.confidence),
      evidenceScore: row.confidence,
      evidenceQuality: row.confidence >= 0.75 ? "HIGH" : "MEDIUM",
      expectedImpact: "Trust and conversion quality when reviewed by operators.",
      operatorAction: "Review queue only — no automatic listing or price changes.",
      blockers: row.decisionType === "FLAG_FOR_FRAUD_REVIEW" ? ["Requires fraud review before boost."] : [],
      warnings: ["Scores are explainable heuristics, not legal findings."],
      metrics: { marketplaceDecisionId: row.id, decisionType: row.decisionType },
    });
  });
}

export function mapUnifiedLearningNudge(input: { evidenceQualityHint: "LOW" | "MEDIUM" | "HIGH" }): AssistantRecommendation[] {
  return [
    baseRec("UNIFIED", "MONITOR", {
      targetId: null,
      targetLabel: "Unified learning blend",
      title: "Unified learning: evidence quality snapshot",
      summary: `Current fused evidence quality: ${input.evidenceQualityHint}.`,
      reason: "Signals from AB, CRO, ads, retargeting, marketplace, and cost layers are blended conservatively.",
      confidenceScore: input.evidenceQualityHint === "HIGH" ? 0.72 : input.evidenceQualityHint === "MEDIUM" ? 0.55 : 0.4,
      evidenceScore: null,
      evidenceQuality: input.evidenceQualityHint,
      expectedImpact: "Better autopilot suggestions when event volume crosses thresholds.",
      operatorAction: "No action required — monitoring only unless other cards apply.",
      blockers: [],
      warnings: input.evidenceQualityHint === "LOW" ? ["Low evidence — avoid aggressive changes."] : [],
      metrics: { evidenceQualityHint: input.evidenceQualityHint },
    }),
  ];
}
