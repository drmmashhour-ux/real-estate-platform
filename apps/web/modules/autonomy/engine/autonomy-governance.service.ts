import type { AutonomousSystemHealth, AutonomyDomain } from "../types/autonomy.types";
import type { OutcomeEvent } from "../types/autonomy.types";

import type { AutonomyMode } from "../autonomy.types";
import { logAutonomy } from "../lib/autonomy-log";

let currentMode: AutonomyMode = "ASSIST";
let paused = false;
let activeDomains: AutonomyDomain[] = ["PRICING", "CONTENT", "LEADS", "BROKER_ROUTING"];

let pendingApprovals = 0;
let executedToday = 0;
let rolledBackToday = 0;
let criticalPolicyEvents = 0;

export function setAutonomyMode(mode: AutonomyMode): void {
  currentMode = mode;
}

export function pauseAutonomy(): void {
  paused = true;
  logAutonomy("[autonomy:governance:pause]", {});
}

export function resumeAutonomy(): void {
  paused = false;
  logAutonomy("[autonomy:governance:resume]", {});
}

export function setActiveAutonomyDomains(domains: AutonomyDomain[]): void {
  activeDomains = [...domains];
}

export function trackPendingApproval(delta: number): void {
  pendingApprovals = Math.max(0, pendingApprovals + delta);
}

export function trackExecutedAction(): void {
  executedToday += 1;
}

export function trackRolledBackAction(): void {
  rolledBackToday += 1;
}

export function trackCriticalPolicyEvent(): void {
  criticalPolicyEvents += 1;
}

/** Recommend pause when negative outcomes materially exceed positive (recent window). */
export function computeRecommendedPauseFromOutcomes(events: OutcomeEvent[]): boolean {
  const recent = events.slice(-50);
  const neg = recent.filter((e) => e.label === "NEGATIVE").length;
  const pos = recent.filter((e) => e.label === "POSITIVE").length;
  return recent.length >= 5 && neg >= pos + 3;
}

export function getAutonomousSystemHealth(eventsForPause?: OutcomeEvent[]): AutonomousSystemHealth {
  const recommendedPause = eventsForPause?.length ? computeRecommendedPauseFromOutcomes(eventsForPause) : false;

  return {
    mode: currentMode,
    isPaused: paused,
    activeDomains,
    pendingApprovals,
    executedToday,
    rolledBackToday,
    criticalPolicyEvents,
    recommendedPause,
    lastUpdatedAt: new Date().toISOString(),
  };
}

/** Test-only resets for deterministic specs. */
export function resetAutonomyGovernanceForTests(): void {
  currentMode = "ASSIST";
  paused = false;
  activeDomains = ["PRICING", "CONTENT", "LEADS", "BROKER_ROUTING"];
  pendingApprovals = 0;
  executedToday = 0;
  rolledBackToday = 0;
  criticalPolicyEvents = 0;
}
