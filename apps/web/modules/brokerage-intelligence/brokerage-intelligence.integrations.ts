/**
 * Soft cross-links: no side effects that send messages, assign people, or execute offers.
 * Strategy benchmark / reinforcement / deal closer are notified only in logs for operators.
 */

import { engineFlags } from "@/config/feature-flags";
import { portfolioIntelLog } from "./brokerage-intelligence-logger";

let lastHint: string | null = null;

/**
 * No-op “touch” for observability; multi-agent or CRM can subscribe to log lines in production.
 */
export function touchStrategyBenchmarkHint(phase: string): void {
  if (!engineFlags.brokerageIntelligenceV1) return;
  lastHint = phase;
  portfolioIntelLog.analysis({ integration: "strategy_benchmark_hint", phase, note: "advisory only" });
}

/**
 * For tests / debug: read last phase without DB.
 */
export function getLastIntegrationHint(): string | null {
  return lastHint;
}

export function suggestReinforcementRebalanceNote(): string {
  return "When FEATURE_REINFORCEMENT_LAYER_V1 is on, bandit order is independent; use portfolio load before accepting AI order.";
}
