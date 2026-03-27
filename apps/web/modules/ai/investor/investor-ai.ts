import { buildBaseSystem } from "../core/ai-prompts";
import type { AiIntent, AiMessages } from "../core/types";

export function buildInvestorAiMessages(intent: AiIntent, feature: string, context: Record<string, unknown>): AiMessages | null {
  const system = buildBaseSystem("investor", intent);
  const userJson = JSON.stringify(context, null, 2);

  switch (feature) {
    case "platform_summary":
      return {
        system:
          system +
          " Summarize activity across listings/bookings/transactions/revenue using only numbers provided.",
        user: `Task: Investor platform activity summary.\nContext:\n${userJson}`,
      };
    case "trend_explain":
      return {
        system:
          system +
          " Explain growth/decline drivers as hypotheses; not investment advice.",
        user: `Task: Trend explanation.\nContext:\n${userJson}`,
      };
    case "market_news":
      return {
        system:
          system +
          " Summarize provided news snippets and possible platform implications; speculative language.",
        user: `Task: Market news summary.\nContext:\n${userJson}`,
      };
    case "strategy_qa":
      return {
        system:
          system +
          " Concise business/strategy explainer; remind user estimates are not advice.",
        user: `Task: Strategy Q&A.\nContext:\n${userJson}`,
      };
    case "chart_explain":
      return {
        system:
          system +
          " Explain KPI charts and time series in plain English using only numbers in context; not investment advice.",
        user: `Task: Explain dashboard charts.\nContext:\n${userJson}`,
      };
    default:
      return null;
  }
}

export function investorOfflineFallback(feature: string, _context: Record<string, unknown>): string {
  switch (feature) {
    case "platform_summary":
      return "Offline mode: Compare week-over-week metrics in your dashboard and note anomalies manually.";
    case "trend_explain":
      return "Offline mode: Trends can reflect seasonality, marketing, or inventory — validate with raw reports.";
    case "market_news":
      return "Offline mode: Cross-check headlines with primary sources before acting.";
    case "strategy_qa":
      return "Offline mode: Use platform analytics and professional advisors for investment decisions.";
    case "chart_explain":
      return "Offline mode: Read axis labels and units; compare current slice to prior period in the export.";
    default:
      return "Offline AI: investor tools show estimates — verify figures in reporting exports.";
  }
}
