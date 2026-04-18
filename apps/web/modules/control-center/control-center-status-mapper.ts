/**
 * Maps subsystem hints into unified control-center statuses — conservative; missing data → limited/unavailable, not critical.
 */
import type { ControlCenterUnifiedStatus } from "./ai-control-center.types";

export type StatusHints = {
  disabled?: boolean;
  unavailable?: boolean;
  hasCriticalSignal?: boolean;
  hasWarning?: boolean;
  hasLimitedCoverage?: boolean;
};

export function mapUnifiedStatus(h: StatusHints): ControlCenterUnifiedStatus {
  if (h.disabled) return "disabled";
  if (h.unavailable) return "unavailable";
  if (h.hasCriticalSignal) return "critical";
  if (h.hasWarning) return "warning";
  if (h.hasLimitedCoverage) return "limited";
  return "healthy";
}

/** Ranking advisory recommendation → severity hint (not auto-execution). */
export function rankingRecommendationIsBlocked(rec: string | null | undefined): boolean {
  return rec === "rollback_recommended" || rec === "stay_in_shadow";
}

export function rankingRecommendationIsOpportunity(rec: string | null | undefined): boolean {
  return rec === "candidate_for_primary" || rec === "expand_phase_c";
}
