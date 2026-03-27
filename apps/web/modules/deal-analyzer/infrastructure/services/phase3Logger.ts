type Phase3Event =
  | "deal_analyzer_offer_strategy"
  | "deal_analyzer_affordability"
  | "deal_analyzer_pricing_advisor"
  | "deal_analyzer_watchlist_alerts"
  | "deal_analyzer_strategy_mode";

export function logDealAnalyzerPhase3(
  event: Phase3Event,
  payload: Record<string, string | number | boolean | null | undefined>,
): void {
  console.log(
    JSON.stringify({
      event,
      service: "deal_analyzer_phase3",
      ...payload,
      ts: new Date().toISOString(),
    }),
  );
}
