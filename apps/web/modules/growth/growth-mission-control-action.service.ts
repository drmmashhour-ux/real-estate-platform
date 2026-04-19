/**
 * Deterministic Mission Control → safe navigation bridge (no execution).
 */

import type {
  GrowthMissionControlFocus,
  GrowthMissionControlSummary,
} from "./growth-mission-control.types";
import type {
  MissionControlActionBundle,
  MissionControlActionItem,
  MissionControlActionPriority,
  MissionControlNavTarget,
} from "./growth-mission-control-action.types";
import {
  pickMissionControlTopAndRest,
  rankMissionControlActions,
} from "./growth-mission-control-top-action.service";
import { recordMissionControlActionsBuilt } from "./growth-mission-control-monitoring.service";

const MAX_ACTION_ITEMS = 5;

function mapFocusSourceToNav(source: GrowthMissionControlFocus["source"]): MissionControlNavTarget {
  switch (source) {
    case "fusion":
      return "fusion";
    case "executive":
      return "executive";
    case "governance":
      return "governance";
    case "strategy":
      return "strategy";
    case "simulation":
      return "simulation";
    case "agents":
      return "multi_agent";
    case "daily_brief":
      return "daily_brief";
    case "autopilot":
      return "cadence";
    case "memory":
      return "memory";
    case "graph":
      return "graph";
    case "journal":
      return "operating_review";
    default:
      return "fusion";
  }
}

function inferNavFromRiskText(title: string, source: string, why: string): MissionControlNavTarget {
  const blob = `${title} ${source} ${why}`.toLowerCase();
  if (blob.includes("broker") && (blob.includes("team") || blob.includes("follow") || blob.includes("closing"))) {
    return blob.includes("admin") || blob.includes("roster") ? "broker_team_admin" : "broker_closing";
  }
  if (blob.includes("host") || blob.includes("bnhub") || blob.includes("stay")) return "host_bnhub";
  if (blob.includes("revenue") || blob.includes("payout")) return "revenue";
  if (blob.includes("fusion")) return "fusion";
  if (blob.includes("simulation")) return "simulation";
  if (source === "fusion") return "fusion";
  if (source === "executive") return "executive";
  if (source === "governance") return "governance";
  return "policy_enforcement";
}

function reviewNav(source: string): MissionControlNavTarget {
  const s = source.toLowerCase();
  if (s.includes("governance")) return "governance_console";
  if (s.includes("fusion")) return "fusion";
  if (s.includes("learning")) return "learning";
  return "policy_enforcement";
}

function riskPriority(severity: "low" | "medium" | "high"): MissionControlActionPriority {
  return severity === "high" ? "high" : severity === "medium" ? "medium" : "low";
}

export function collectMissionControlActionCandidates(summary: GrowthMissionControlSummary): MissionControlActionItem[] {
  const out: MissionControlActionItem[] = [];

  if (summary.frozenDomains.length > 0 || summary.blockedDomains.length > 0) {
    const fd = summary.frozenDomains.join(", ") || "—";
    const bd = summary.blockedDomains.join(", ") || "—";
    out.push({
      id: "bridge-gov-domains",
      source: "risk",
      title: "Review governance domain posture",
      description: `Frozen: ${fd} · Blocked: ${bd}`,
      navTarget: "governance_console",
      actionType: "inspect_risk",
      priority: "high",
      rationale: "Mission control shows active frozen/blocked domains — operator should confirm policy alignment.",
      operatorHint: "Compare listed domains against current campaigns and automation scope.",
      doneHint: "You have verified whether freezes/blocks still match intended governance posture.",
      queryParams: { reason: "governance_domain_posture" },
      prefillData: { frozen: fd, blocked: bd },
    });
  }

  if (summary.missionFocus) {
    const mf = summary.missionFocus;
    const nav = mapFocusSourceToNav(mf.source);
    out.push({
      id: `bridge-focus-${mf.source}`,
      source: "focus",
      title: `Open ${mf.title.slice(0, 72)}`,
      description: mf.why.slice(0, 220),
      navTarget: nav,
      actionType: "open_panel",
      priority: summary.status === "weak" || summary.status === "watch" ? "high" : "medium",
      rationale: "This is the resolved mission focus — validate the upstream panel feeding it.",
      operatorHint: "Confirm numbers and recommendations match what operators see in the target panel.",
      doneHint: "Focus claim is validated or corrected for the team.",
      queryParams: { reason: `focus_${mf.source}` },
      prefillData: { focusSource: mf.source },
    });
  }

  for (let i = 0; i < summary.topRisks.length && i < 3; i++) {
    const r = summary.topRisks[i]!;
    const nav = inferNavFromRiskText(r.title, r.source, r.why);
    out.push({
      id: `bridge-risk-${i}-${r.source}`,
      source: "risk",
      title: r.title.slice(0, 120),
      description: r.why.slice(0, 220),
      navTarget: nav,
      actionType: "inspect_risk",
      priority: riskPriority(r.severity),
      rationale: `Risk signal (${r.source}) surfaced in Mission Control.`,
      operatorHint: "Read the linked panel and confirm whether mitigations or pauses are needed.",
      doneHint: "Risk is acknowledged with a documented next step or dismissal reason.",
      queryParams: { reason: `risk_${r.source}` },
    });
  }

  for (let i = 0; i < summary.humanReviewQueue.length && i < 2; i++) {
    const it = summary.humanReviewQueue[i]!;
    out.push({
      id: `bridge-review-${it.id}`,
      source: "review",
      title: it.title.slice(0, 120),
      description: it.reason.slice(0, 220),
      navTarget: reviewNav(it.source),
      actionType: "review_item",
      priority: riskPriority(it.severity),
      rationale: "Human review queue item merged into Mission Control.",
      operatorHint: "Validate the underlying record and capture an explicit decision.",
      doneHint: "Queue item is approved, deferred with owner, or declined with rationale.",
      queryParams: { reason: "human_review", reviewId: it.id },
    });
  }

  if (summary.simulationRecommendation?.trim()) {
    out.push({
      id: "bridge-simulation",
      source: "note",
      title: "Review growth simulations",
      description: summary.simulationRecommendation.slice(0, 220),
      navTarget: "simulation",
      actionType: "open_panel",
      priority: "medium",
      rationale: "Simulation summary line is present — estimates are advisory only.",
      operatorHint: "Check scenario assumptions and defer/consider flags before operationalizing.",
      doneHint: "Simulation stance is understood and reflected in planning notes.",
      queryParams: { reason: "simulation_advisory" },
    });
  }

  if (summary.strategyFocus?.trim()) {
    out.push({
      id: "bridge-strategy",
      source: "note",
      title: "Align on weekly strategy priority",
      description: summary.strategyFocus.slice(0, 220),
      navTarget: "strategy",
      actionType: "navigate",
      priority: "medium",
      rationale: "Strategy bundle reported a top priority for the week.",
      operatorHint: "Confirm priority still matches capacity and governance posture.",
      doneHint: "Team agrees the priority is still valid or an updated priority is published.",
      queryParams: { reason: "strategy_priority" },
    });
  }

  for (let i = 0; i < Math.min(1, summary.todayChecklist.length); i++) {
    const line = summary.todayChecklist[i]!;
    const blob = line.toLowerCase();
    let nav: MissionControlNavTarget = "cadence";
    if (blob.includes("broker")) nav = "broker_closing";
    if (blob.includes("fusion")) nav = "fusion";
    if (blob.includes("governance")) nav = "governance";
    out.push({
      id: "bridge-checklist-0",
      source: "checklist",
      title: "Today: operator checklist item",
      description: line.slice(0, 220),
      navTarget: nav,
      actionType: "navigate",
      priority: "low",
      rationale: "Top checklist line mapped to the closest operational panel by keyword.",
      operatorHint: "Execute or schedule the checklist step in the linked surface.",
      doneHint: "Checklist step is complete or explicitly deferred.",
      queryParams: { reason: "checklist_top" },
    });
  }

  for (const note of summary.notes) {
    const n = note.toLowerCase();
    if (n.includes("fusion") && n.includes("weak")) {
      out.push({
        id: "bridge-note-fusion-weak",
        source: "note",
        title: "Validate fusion weak-band signal",
        description: note.slice(0, 220),
        navTarget: "fusion",
        actionType: "inspect_risk",
        priority: "medium",
        rationale: "Mission notes cite weak fusion — cross-check before scaling.",
        operatorHint: "Compare fusion inputs vs executive and governance panels.",
        doneHint: "Fusion weakness is confirmed or cleared with sources cited.",
        queryParams: { reason: "fusion_weak_signal" },
      });
      break;
    }
  }

  if (summary.status === "weak" && !out.some((x) => x.navTarget === "executive")) {
    out.push({
      id: "bridge-status-weak-exec",
      source: "note",
      title: "Review executive snapshot (weak posture)",
      description: "Overall mission control posture is weak — executive summary is the fastest health check.",
      navTarget: "executive",
      actionType: "open_panel",
      priority: "high",
      rationale: "Weak Mission Control status — executive panel contextualizes revenue and campaign bands.",
      operatorHint: "Scan executive KPI bands and risk lines for immediate misalignment.",
      doneHint: "You can explain why posture is weak and what would move it to watch/healthy.",
      queryParams: { reason: "mc_status_weak" },
    });
  }

  return out;
}

export function buildMissionControlActionBundle(summary: GrowthMissionControlSummary): MissionControlActionBundle {
  const candidates = collectMissionControlActionCandidates(summary);
  const ranked = rankMissionControlActions(candidates);
  const { topAction, rest } = pickMissionControlTopAndRest(ranked, MAX_ACTION_ITEMS);

  try {
    recordMissionControlActionsBuilt({
      candidateCount: candidates.length,
      rankedCount: ranked.length,
      topGenerated: Boolean(topAction),
      listCount: rest.length,
    });
  } catch {
    /* noop */
  }

  return {
    topAction,
    actionItems: rest,
    generatedAt: new Date().toISOString(),
  };
}
