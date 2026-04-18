/**
 * Single mission-control status from cross-surface signals.
 */

import type { BNHubMissionControlStatus, BNHubMissionControlSummary } from "./mission-control.types";

export function classifyMissionControlStatus(summary: BNHubMissionControlSummary): BNHubMissionControlStatus {
  const risks = summary.topRisks.length;
  const weak = summary.weakSignals.length;
  const rs = summary.rankingScore ?? 0;

  const gc = summary.guestConversionStatus ?? "";
  const bh = summary.bookingHealth ?? "";
  const hs = summary.hostStatus ?? "";

  const bad =
    (gc === "weak" ? 1 : 0) +
    (bh === "weak" ? 1 : 0) +
    (hs === "weak" ? 1 : 0) +
    (risks >= 3 ? 1 : 0);

  if (bad >= 2 || weak >= 8) return "weak";

  const watchHints =
    (gc === "watch" ? 1 : 0) +
    (bh === "watch" ? 1 : 0) +
    (hs === "watch" ? 1 : 0) +
    (risks >= 1 ? 1 : 0);

  if (watchHints >= 2 && rs < 45) return "weak";
  if (watchHints >= 1 && watchHints <= 3 && rs >= 35) return "watch";

  if (rs >= 65 && gc === "healthy" && bh === "strong" && (hs === "healthy" || hs === "strong")) {
    return "strong";
  }

  if (rs >= 45 && gc !== "weak" && bh !== "weak") return "healthy";

  return "watch";
}
