type Phase4Payload = Record<string, string | number | undefined | null>;

export function logDealAnalyzerPhase4(event: string, payload: Phase4Payload) {
  console.info(JSON.stringify({ source: "deal_analyzer_phase4", event, ...payload }));
}
