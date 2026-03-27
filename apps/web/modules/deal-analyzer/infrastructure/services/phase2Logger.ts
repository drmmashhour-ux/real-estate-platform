type Phase2Event =
  | "deal_analyzer_comparable_run"
  | "deal_analyzer_scenario_run"
  | "deal_analyzer_portfolio_rank"
  | "deal_analyzer_bnhub_run"
  | "deal_analyzer_decision_refine";

export function logDealAnalyzerPhase2(
  event: Phase2Event,
  payload: Record<string, string | number | boolean | null | undefined>,
): void {
  console.log(
    JSON.stringify({
      event,
      service: "deal_analyzer_phase2",
      ...payload,
      ts: new Date().toISOString(),
    }),
  );
}
