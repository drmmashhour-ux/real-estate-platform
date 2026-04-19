/**
 * Conservative, deterministic insight strings — no causal claims.
 */

import type {
  FastDealLandingPerformanceRow,
  FastDealPlaybookProgressRow,
  FastDealSparseSummary,
  FastDealSourcingUsageRow,
} from "@/modules/growth/fast-deal-results.types";

export function generateFastDealInsights(input: {
  sourcing: FastDealSourcingUsageRow[];
  landing: FastDealLandingPerformanceRow[];
  playbook: FastDealPlaybookProgressRow[];
  outcomeTotals: { leadCaptured: number; progressed: number; closed: number };
  sparse: FastDealSparseSummary;
}): string[] {
  const lines: string[] = [];

  if (input.sparse.level !== "ok") {
    lines.push(input.sparse.message);
  }

  if (input.sourcing.length > 0) {
    const top = input.sourcing[0]!;
    lines.push(
      `Broker sourcing activity is logged most often for “${top.platform}” (${top.events} events) — operator-reported usage only.`,
    );
    const runner = input.sourcing[1];
    if (runner && input.sourcing.length >= 2) {
      lines.push(`Next channel by volume: “${runner.platform}” (${runner.events} events).`);
    }
  } else {
    lines.push("No broker sourcing events logged yet — use Copy session / query actions on the playbook to attribute usage.");
  }

  const landed = input.landing.filter((r) => r.submitted > 0);
  if (landed.length > 0) {
    const topMarket = [...landed].sort((a, b) => b.submitted - a.submitted)[0]!;
    lines.push(
      `Growth preview landing captured submissions for “${topMarket.marketVariant}” (${topMarket.submitted}) — counting form posts only, not quality.`,
    );
  } else if (input.landing.some((r) => r.previewShown > 0 || r.formStarted > 0)) {
    lines.push("Landing previews or form starts were logged, but no submitted events yet — check operator tests vs. production URLs.");
  }

  const skipHints = input.playbook.filter((p) => p.possiblySkippedHints > 0 && p.step <= 6);
  if (skipHints.length > 0) {
    const worst = [...skipHints].sort((a, b) => b.possiblySkippedHints - a.possiblySkippedHints)[0]!;
    lines.push(
      `Playbook step ${worst.step} shows more acknowledgements than completions in logs — possible skips (weak signal; confirm manually).`,
    );
  }

  const { leadCaptured, progressed, closed } = input.outcomeTotals;
  if (leadCaptured > 0 && progressed + closed === 0 && input.sparse.level !== "very_low") {
    lines.push(
      "Lead capture outcomes exist but few downstream progression tags — progression may be untracked or delayed (not necessarily failure).",
    );
  }

  if (
    input.landing.length >= 3 &&
    input.sparse.level === "ok" &&
    new Set(input.landing.map((r) => r.marketVariant)).size >= 3
  ) {
    lines.push(
      "Multiple market variants present — comparing markets statistically is not supported with this sample; keep per-market rows as separate stories.",
    );
  } else if (input.landing.length >= 2 && input.sparse.level !== "ok") {
    lines.push("Insufficient data to compare markets reliably — treat city rows as illustrative only.");
  }

  return lines.slice(0, 8);
}
