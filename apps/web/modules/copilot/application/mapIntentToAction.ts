import type { CopilotIntent } from "@prisma/client";
import { CopilotUserIntent } from "@/modules/copilot/domain/copilotIntents";
import type { CopilotActionPlan } from "@/modules/copilot/domain/copilotTypes";

/** Human-readable skeleton for docs/tests — real execution stays in {@link runCopilot}. */
export type IntentActionDescriptor = {
  type: string;
  summary: string;
  data: unknown;
};

export async function mapIntentToActionDescriptor(input: {
  userId: string;
  workspaceId?: string;
  query: string;
  intent: CopilotIntent;
}): Promise<IntentActionDescriptor> {
  switch (input.intent) {
    case "analyze_property":
      return {
        type: "deal_analysis",
        summary: "Run property analysis using deterministic scoring.",
        data: null,
      };
    case "improve_listing":
      return {
        type: "listing_improvement",
        summary: "Fetch trust issues and missing items for this listing.",
        data: null,
      };
    case "why_not_selling":
      return {
        type: "listing_diagnosis",
        summary: "Use trust, pricing, and readiness to explain weak performance.",
        data: null,
      };
    case "portfolio_summary":
      return {
        type: "portfolio_summary",
        summary: "Summarize portfolio alerts, rankings, and risk shifts.",
        data: null,
      };
    case "pricing_help":
      return {
        type: "pricing_advice",
        summary: "Return pricing advisor output and comparable positioning.",
        data: null,
      };
    case "risk_check":
      return {
        type: "risk_check",
        summary: "Return TrustGraph and deal risk signals in sanitized form.",
        data: null,
      };
    case "find_deals":
      return {
        type: "deal_search",
        summary: "Search listings and rank likely opportunities.",
        data: null,
      };
    default:
      return {
        type: "unknown",
        summary: "Intent unclear. Ask user to refine target listing or goal.",
        data: null,
      };
  }
}

export function mapIntentToAction(intent: CopilotUserIntent): CopilotActionPlan {
  switch (intent) {
    case CopilotUserIntent.FIND_DEALS:
      return {
        intent,
        steps: ["parse_query_filters", "query_active_listings", "ensure_deal_analyses", "rank_investor_portfolio"],
      };
    case CopilotUserIntent.ANALYZE_PROPERTY:
      return { intent, steps: ["resolve_listing_id", "ensure_deal_analysis", "load_public_deal_dto"] };
    case CopilotUserIntent.WHY_NOT_SELLING:
      return {
        intent,
        steps: ["load_owner_listing", "deal_analysis_public", "seller_pricing_advisor", "trust_media_signals"],
      };
    case CopilotUserIntent.IMPROVE_LISTING:
      return {
        intent,
        steps: ["load_listing_context", "trustgraph_missing_items", "moderation_media_checks"],
      };
    case CopilotUserIntent.PORTFOLIO_SUMMARY:
      return { intent, steps: ["resolve_watchlist", "portfolio_monitoring_or_alerts"] };
    case CopilotUserIntent.RISK_CHECK:
      return { intent, steps: ["load_listing", "trust_scores", "trustgraph_optional"] };
    case CopilotUserIntent.PRICING_HELP:
      return { intent, steps: ["load_listing", "run_or_load_seller_pricing_advisor"] };
    default:
      return { intent: CopilotUserIntent.UNKNOWN, steps: ["clarify"] };
  }
}
