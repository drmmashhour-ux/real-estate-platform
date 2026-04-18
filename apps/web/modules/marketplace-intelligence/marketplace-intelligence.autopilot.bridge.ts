import { aiAutopilotV1Flags, marketplaceIntelligenceFlags } from "@/config/feature-flags";
import type { ProposedAction } from "@/modules/ai-autopilot/ai-autopilot.types";
import { getRecentMarketplaceDecisions } from "./marketplace-intelligence.repository";

function mapDecision(row: {
  id: string;
  decisionType: string;
  listingId: string | null;
  confidence: number;
  priority: string;
  reason: string;
}): ProposedAction | null {
  const base = {
    domain: "marketplace_intelligence" as const,
    entityType: "bnhub_listing",
    entityId: row.listingId,
    summary: row.reason,
    severity: row.priority === "HIGH" ? "medium" : "low",
    riskLevel: row.priority === "HIGH" ? ("MEDIUM" as const) : ("LOW" as const),
    recommendedPayload: {
      marketplaceDecisionLogId: row.id,
      listingId: row.listingId,
      confidence: row.confidence,
      manualApprovalRequired: true,
    },
    reasons: {
      source: "marketplace_intelligence_v6",
      priority: row.priority,
      confidence: row.confidence,
    },
    subjectUserId: null,
    audience: "admin" as const,
  };

  switch (row.decisionType) {
    case "REVIEW_LISTING":
      return {
        ...base,
        actionType: "MARKETPLACE_REVIEW_LISTING",
        title: "Review listing (trust weak)",
      };
    case "FLAG_FOR_FRAUD_REVIEW":
      return {
        ...base,
        actionType: "MARKETPLACE_FLAG_FRAUD_REVIEW",
        title: "Fraud review queue (manual)",
      };
    case "RECOMMEND_PRICE_CHANGE":
      return {
        ...base,
        actionType: "MARKETPLACE_RECOMMEND_PRICE_CHANGE",
        title: "Pricing recommendation pending approval",
      };
    case "QUALITY_IMPROVEMENT_RECOMMENDED":
      return {
        ...base,
        actionType: "MARKETPLACE_QUALITY_IMPROVEMENT",
        title: "Quality improvement suggestions",
      };
    case "BOOST_LISTING":
      return {
        ...base,
        actionType: "MARKETPLACE_BOOST_CANDIDATE",
        title: "Boost exposure candidate (review)",
      };
    case "DOWNRANK_LISTING":
      return {
        ...base,
        actionType: "MARKETPLACE_REVIEW_LISTING",
        title: "Weak ranking — review before promotion",
      };
    default:
      return null;
  }
}

/**
 * Admin-only, non-destructive proposals derived from persisted decision logs (no auto-execution).
 */
export async function proposalsMarketplaceIntelligence(userId: string): Promise<ProposedAction[]> {
  if (!aiAutopilotV1Flags.aiAutopilotV1 || !marketplaceIntelligenceFlags.marketplaceIntelligenceV1) {
    return [];
  }

  const rows = await getRecentMarketplaceDecisions(24);
  const seen = new Set<string>();
  const out: ProposedAction[] = [];

  for (const row of rows) {
    const key = `${row.decisionType}:${row.listingId ?? "none"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const p = mapDecision(row);
    if (p) {
      out.push({
        ...p,
        recommendedPayload: { ...p.recommendedPayload, operatorUserId: userId },
      });
    }
  }

  return out.slice(0, 12);
}
