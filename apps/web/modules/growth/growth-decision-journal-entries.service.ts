/**
 * Normalizes current growth signals into bounded journal entries — read-only; no persistence.
 */

import type {
  GrowthDecisionJournalDecision,
  GrowthDecisionJournalEntry,
  GrowthDecisionJournalSource,
} from "./growth-decision-journal.types";
import type { GrowthDecisionJournalBuildInput } from "./growth-decision-journal-build-input.types";

const MAX_ENTRIES = 36;

function stableId(parts: string[]): string {
  let h = 0;
  const key = parts.join("|").slice(0, 240);
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return `gdj-e-${Math.abs(h).toString(36)}`;
}

function now(): string {
  return new Date().toISOString();
}

function push(
  out: GrowthDecisionJournalEntry[],
  source: GrowthDecisionJournalSource,
  title: string,
  summary: string,
  decision: GrowthDecisionJournalDecision,
  opts?: { why?: string; linkedActionId?: string; linkedEntityId?: string; tags?: string[] },
): void {
  if (out.length >= MAX_ENTRIES) return;
  const t = title.trim().slice(0, 200);
  const s = summary.trim().slice(0, 400);
  if (!t || !s) return;
  const id = stableId([source, t, decision]);
  if (out.some((e) => e.id === id)) return;
  out.push({
    id,
    source,
    title: t,
    summary: s,
    decision,
    why: opts?.why?.slice(0, 400),
    linkedActionId: opts?.linkedActionId,
    linkedEntityId: opts?.linkedEntityId,
    tags: opts?.tags,
    createdAt: now(),
  });
}

function mapAutopilotDecision(
  status: import("./ai-autopilot.types").AiAutopilotActionStatus,
  executionStatus?: import("./ai-autopilot.types").AiAutopilotExecutionStatus,
): GrowthDecisionJournalDecision {
  if (executionStatus === "executed") return "executed";
  if (executionStatus === "failed" || executionStatus === "rolled_back") return "review_required";
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "recommended";
}

/**
 * Builds journal entries from read-only snapshots (bounded, deduplicated).
 */
export function buildGrowthDecisionJournalEntries(input: GrowthDecisionJournalBuildInput): GrowthDecisionJournalEntry[] {
  const out: GrowthDecisionJournalEntry[] = [];

  const ap = input.autopilot;
  if (ap?.actions?.length) {
    for (const a of ap.actions.slice(0, 14)) {
      const decision = mapAutopilotDecision(a.status, a.executionStatus);
      push(
        out,
        "autopilot",
        a.title,
        `Autopilot ${a.source.toUpperCase()} · impact ${a.impact} · mode ${a.executionMode}`,
        decision,
        {
          why: a.why,
          linkedActionId: a.id,
          tags: [a.source, a.status, a.executionStatus ?? "none"],
        },
      );
    }
  }

  const ex = input.executive;
  if (ex) {
    for (const p of ex.topPriorities.slice(0, 6)) {
      push(out, "executive", p.title, `Executive priority (${p.source}) · impact ${p.impact}`, "recommended", {
        why: p.why,
        linkedEntityId: p.id,
        tags: ["priority", p.source],
      });
    }
    for (const r of ex.topRisks.slice(0, 4)) {
      if (!r?.trim()) continue;
      push(out, "executive", r.trim().slice(0, 160), "Risk called out in executive snapshot", "review_required", {
        tags: ["risk"],
      });
    }
    push(
      out,
      "executive",
      `Ads band: ${ex.campaignSummary.adsPerformance}`,
      `Campaigns tracked: ${ex.campaignSummary.totalCampaigns}`,
      "recommended",
      { tags: ["ads_band", ex.campaignSummary.adsPerformance] },
    );
  }

  const gov = input.governance;
  if (gov) {
    push(
      out,
      "governance",
      `Governance posture: ${gov.status}`,
      `Blocked: ${gov.blockedDomains.join(", ") || "—"} · Frozen: ${gov.frozenDomains.join(", ") || "—"}`,
      gov.status === "freeze_recommended" || gov.status === "human_review_required" ? "review_required" : "recommended",
      { why: gov.notes[0], tags: [gov.status] },
    );
    for (const h of gov.humanReviewQueue.slice(0, 4)) {
      push(out, "governance", h.title, h.reason, "review_required", {
        linkedEntityId: h.id,
        tags: [h.category, h.severity],
      });
    }
  }

  const strat = input.strategyBundle;
  if (strat) {
    for (const p of strat.weeklyPlan.priorities.slice(0, 5)) {
      push(out, "strategy", p.title, `Strategy theme ${p.theme} · impact ${p.impact}`, "recommended", {
        why: p.why,
        linkedEntityId: p.id,
        tags: [p.theme],
      });
    }
    for (const b of strat.weeklyPlan.blockers.slice(0, 4)) {
      if (!b?.trim()) continue;
      push(out, "strategy", b.trim().slice(0, 160), "Weekly plan blocker (advisory)", "deferred", {
        tags: ["blocker"],
      });
    }
  }

  const sim = input.simulationBundle;
  if (sim?.scenarios?.length) {
    for (const s of sim.scenarios.slice(0, 5)) {
      const decision: GrowthDecisionJournalDecision =
        s.recommendation === "defer"
          ? "deferred"
          : s.recommendation === "caution"
            ? "review_required"
            : "recommended";
      push(out, "simulation", s.title, s.downsideSummary.slice(0, 200), decision, {
        linkedEntityId: s.scenarioId,
        tags: [s.recommendation, s.confidence],
      });
    }
  }

  const mc = input.missionControl;
  if (mc?.missionFocus) {
    const f = mc.missionFocus;
    push(out, f.source as GrowthDecisionJournalSource, f.title, "Mission Control focus (advisory)", "recommended", {
      why: f.why,
      tags: ["mission_focus"],
    });
  }
  if (mc?.todayChecklist?.length) {
    for (const line of mc.todayChecklist.slice(0, 5)) {
      if (!line?.trim()) continue;
      push(out, "manual", line.trim().slice(0, 160), "Mission Control checklist item", "recommended", {
        tags: ["checklist"],
      });
    }
  }
  if (mc?.humanReviewQueue?.length) {
    for (const h of mc.humanReviewQueue.slice(0, 4)) {
      push(out, "governance", h.title, h.reason, "review_required", {
        linkedEntityId: h.id,
        tags: ["mission_review", h.severity],
      });
    }
  }

  const brief = input.dailyBrief;
  if (brief?.today?.focus?.trim()) {
    push(out, "daily_brief", brief.today.focus.trim(), "Daily brief stated focus", "recommended", {
      tags: [brief.status],
    });
  }
  for (const b of brief?.today?.priorities?.slice(0, 4) ?? []) {
    if (!b?.trim()) continue;
    push(out, "daily_brief", b.trim().slice(0, 160), "Daily brief priority line", "recommended", {
      tags: ["priority_line"],
    });
  }
  for (const b of brief?.blockers?.slice(0, 3) ?? []) {
    if (!b?.trim()) continue;
    push(out, "daily_brief", b.trim().slice(0, 160), "Daily brief blocker", "deferred", { tags: ["blocker"] });
  }

  const coord = input.coordination;
  if (coord?.topPriorities?.length) {
    for (const p of coord.topPriorities.slice(0, 4)) {
      push(out, "agents", p.title, `Agent ${p.agentId} · ${p.domain}`, "recommended", {
        why: p.rationale,
        linkedEntityId: p.id,
        tags: [p.agentId],
      });
    }
  }

  if (input.missingDataWarnings.length) {
    push(
      out,
      "manual",
      "Partial growth data",
      input.missingDataWarnings.slice(0, 5).join("; "),
      "review_required",
      { tags: ["missing_data"] },
    );
  }

  return out;
}
