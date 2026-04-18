/**
 * "What worked" lines — bounded, evidence-based only; no fabricated wins.
 */

import type {
  GrowthOperatingReviewBuildInput,
  GrowthOperatingReviewItem,
} from "./growth-operating-review.types";

const MAX = 5;

let seq = 0;
function item(
  category: GrowthOperatingReviewItem["category"],
  source: GrowthOperatingReviewItem["source"],
  title: string,
  detail: string,
  severity: GrowthOperatingReviewItem["severity"],
  createdAt: string,
): GrowthOperatingReviewItem {
  seq += 1;
  return {
    id: `gor-worked-${seq}`,
    category,
    title,
    detail,
    source,
    severity,
    createdAt,
  };
}

export function buildWorkedItems(input: GrowthOperatingReviewBuildInput): GrowthOperatingReviewItem[] {
  seq = 0;
  const out: GrowthOperatingReviewItem[] = [];
  const { createdAt } = input;
  const ex = input.executive;

  if (ex?.campaignSummary.adsPerformance === "STRONG" && (ex.leadSummary.hotLeads ?? 0) >= 1) {
    out.push(
      item("worked", "executive", "Paid funnel band strong with active hot leads", ex.topPriority ?? "Executive snapshot shows STRONG ads performance.", "medium", createdAt),
    );
  }

  if (ex && ex.leadSummary.dueNow === 0 && (ex.leadSummary.hotLeads ?? 0) >= 1 && (input.followUp.dueNow ?? 0) <= 2) {
    out.push(
      item(
        "worked",
        "executive",
        "Follow-up queue not showing due-now pile-up",
        "Hot lead signal present without large due-now backlog in review inputs.",
        "low",
        createdAt,
      ),
    );
  }

  for (const w of input.memorySummary?.winningPatterns.slice(0, 2) ?? []) {
    out.push(
      item("worked", "memory", w.title, w.detail.slice(0, 240), w.confidence >= 0.6 ? "medium" : "low", createdAt),
    );
  }

  if (input.governance?.status === "healthy" && (input.governance.frozenDomains?.length ?? 0) === 0) {
    out.push(
      item(
        "worked",
        "governance",
        "Governance posture stable",
        "No freeze or block domains on the governance decision — advisory signals aligned with calm operation.",
        "low",
        createdAt,
      ),
    );
  }

  if (input.strategyBundle?.weeklyPlan.status === "strong" || input.strategyBundle?.weeklyPlan.status === "healthy") {
    out.push(
      item(
        "worked",
        "strategy",
        "Strategy plan shows healthy/strong band",
        `Weekly plan status: ${input.strategyBundle.weeklyPlan.status}.`,
        "medium",
        createdAt,
      ),
    );
  }

  for (const line of input.journalReflections.slice(0, 2)) {
    const t = line.trim();
    if (t.length < 8) continue;
    if (/worked|win|good|positive|improved/i.test(t)) {
      out.push(item("worked", "journal", "Journal reflection (positive signal)", t.slice(0, 220), "low", createdAt));
    }
  }

  return out.slice(0, MAX);
}
