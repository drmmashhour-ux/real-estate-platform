function parseTruthy(raw: string | undefined): boolean {
  if (raw == null || raw === "") return false;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

/** Master switch — Deal Analyzer Phase 1 (deterministic scoring, no LLM verdict). */
export function isDealAnalyzerEnabled(): boolean {
  return parseTruthy(process.env.DEAL_ANALYZER_ENABLED);
}

export function isDealAnalyzerCompsEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_COMPS_ENABLED);
}

export function isDealAnalyzerScenariosEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_SCENARIOS_ENABLED);
}

export function isDealAnalyzerPortfolioEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_PORTFOLIO_ENABLED);
}

export function isDealAnalyzerBnhubModeEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_BNHUB_MODE_ENABLED);
}

export function isDealAnalyzerOfferAssistantEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_OFFER_ASSISTANT_ENABLED);
}

export function isDealAnalyzerMortgageModeEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_MORTGAGE_MODE_ENABLED);
}

export function isDealAnalyzerAlertsEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_ALERTS_ENABLED);
}

export function isDealAnalyzerPricingAdvisorEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_PRICING_ADVISOR_ENABLED);
}

export function isDealAnalyzerStrategyModesEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_STRATEGY_MODES_ENABLED);
}

export function isDealAnalyzerAutoRefreshEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_AUTO_REFRESH_ENABLED);
}

export function isDealAnalyzerRegionRulesEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_REGION_RULES_ENABLED);
}

export function isDealAnalyzerNegotiationPlaybooksEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_NEGOTIATION_PLAYBOOKS_ENABLED);
}

export function isDealAnalyzerRepricingTriggersEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_REPRICING_TRIGGERS_ENABLED);
}

export function isDealAnalyzerPortfolioMonitoringEnabled(): boolean {
  return isDealAnalyzerEnabled() && parseTruthy(process.env.DEAL_ANALYZER_PORTFOLIO_MONITORING_ENABLED);
}
