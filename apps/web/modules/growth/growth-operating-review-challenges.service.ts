/**
 * Challenges: didn't work, blocked, deferred — deterministic, conservative.
 */

import type {
  GrowthOperatingReviewBuildInput,
  GrowthOperatingReviewItem,
} from "./growth-operating-review.types";

const MAX_EACH = 5;

let seq = 0;
function mk(
  category: GrowthOperatingReviewItem["category"],
  source: GrowthOperatingReviewItem["source"],
  title: string,
  detail: string,
  severity: GrowthOperatingReviewItem["severity"],
  createdAt: string,
): GrowthOperatingReviewItem {
  seq += 1;
  return {
    id: `gor-ch-${category}-${seq}`,
    category,
    title,
    detail,
    source,
    severity,
    createdAt,
  };
}

export function buildDidntWorkItems(input: GrowthOperatingReviewBuildInput): GrowthOperatingReviewItem[] {
  seq = 0;
  const out: GrowthOperatingReviewItem[] = [];
  const { createdAt } = input;
  const ex = input.executive;

  if (ex?.campaignSummary.adsPerformance === "WEAK") {
    out.push(
      mk("didnt_work", "executive", "Campaign / paid funnel band weak", "Executive snapshot classifies ads performance as WEAK — review creative and targeting manually.", "high", createdAt),
    );
  }

  if ((ex?.topRisks?.length ?? 0) >= 2) {
    out.push(
      mk(
        "didnt_work",
        "executive",
        "Multiple executive risk lines",
        ex!.topRisks.slice(0, 2).join(" · ").slice(0, 220),
        "medium",
        createdAt,
      ),
    );
  }

  if (input.strategyBundle?.weeklyPlan.status === "weak") {
    out.push(
      mk("didnt_work", "strategy", "Weekly strategy plan in weak band", "Priorities may need reshaping before scaling experiments.", "medium", createdAt),
    );
  }

  for (const b of input.memorySummary?.recurringBlockers.slice(0, 2) ?? []) {
    out.push(mk("didnt_work", "memory", b.title, b.detail.slice(0, 220), "medium", createdAt));
  }

  if (input.followUp.highIntentQueued >= 8) {
    out.push(
      mk(
        "didnt_work",
        "autopilot",
        "High-intent follow-up pressure",
        `${input.followUp.highIntentQueued} high-score items queued or due — capacity risk.`,
        "high",
        createdAt,
      ),
    );
  }

  return out.slice(0, MAX_EACH);
}

export function buildBlockedItems(input: GrowthOperatingReviewBuildInput): GrowthOperatingReviewItem[] {
  seq = 0;
  const out: GrowthOperatingReviewItem[] = [];
  const { createdAt } = input;
  const g = input.governance;

  if (g?.status === "human_review_required" || g?.status === "freeze_recommended") {
    out.push(
      mk(
        "blocked",
        "governance",
        `Governance: ${g.status.replace(/_/g, " ")}`,
        `Frozen: ${g.frozenDomains.join(", ") || "—"}; blocked: ${g.blockedDomains.join(", ") || "—"}.`,
        "high",
        createdAt,
      ),
    );
  }

  for (const t of input.enforcementSnapshot?.blockedTargets.slice(0, 3) ?? []) {
    out.push(
      mk("blocked", "governance", `Policy enforcement blocked: ${t}`, "Non-critical advisory path blocked by enforcement snapshot.", "medium", createdAt),
    );
  }

  if (input.learningControlFreezeRecommended) {
    out.push(
      mk(
        "blocked",
        "governance",
        "Learning adjustments frozen",
        "Learning control recommends freeze — adaptive weight updates should not apply until review.",
        "medium",
        createdAt,
      ),
    );
  }

  if (input.autopilot.rejected >= 3) {
    out.push(
      mk(
        "blocked",
        "autopilot",
        "Multiple rejected autopilot actions",
        `${input.autopilot.rejected} rejected rows — reconcile policy before promoting new actions.`,
        "high",
        createdAt,
      ),
    );
  }

  return out.slice(0, MAX_EACH);
}

export function buildDeferredItems(input: GrowthOperatingReviewBuildInput): GrowthOperatingReviewItem[] {
  seq = 0;
  const out: GrowthOperatingReviewItem[] = [];
  const { createdAt } = input;

  const deferScen =
    input.simulationBundle?.scenarios.filter((s) => s.recommendation === "defer") ?? [];
  for (const s of deferScen.slice(0, 3)) {
    const detail =
      s.notes.length > 0 ? s.notes.join("; ").slice(0, 200) : s.downsideSummary.slice(0, 200);
    out.push(mk("deferred", "simulation", `Simulation defer: ${s.title}`, detail, "low", createdAt));
  }

  const road = input.strategyBundle?.weeklyPlan.roadmap.filter((r) => r.priority === "low") ?? [];
  for (const r of road.slice(0, 2)) {
    out.push(mk("deferred", "strategy", `Roadmap deferred theme: ${r.title}`, r.why.slice(0, 180), "low", createdAt));
  }

  if ((input.dailyBrief?.today.priorities.length ?? 0) > 4) {
    out.push(
      mk(
        "deferred",
        "executive",
        "Large daily priority surface",
        "Many concurrent priorities in brief — some work may remain queued behind higher urgency.",
        "low",
        createdAt,
      ),
    );
  }

  return out.slice(0, MAX_EACH);
}
