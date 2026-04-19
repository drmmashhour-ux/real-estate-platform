/**
 * Deterministic bounded session plans from Mission Control snapshot + action bundle.
 */

import type { GrowthMissionControlSummary } from "./growth-mission-control.types";
import type { MissionControlActionBundle } from "./growth-mission-control-action.types";
import type { MissionSession, MissionSessionStep, MissionSessionSummary } from "./growth-mission-session.types";

const MAX_STEPS = 10;

function mapActionToStepKind(
  t: string,
): "navigate" | "open_panel" | "inspect" | "mark_done" {
  if (t === "inspect_risk") return "inspect";
  if (t === "open_panel" || t === "open_draft") return "open_panel";
  if (t === "review_item") return "inspect";
  return "navigate";
}

export function buildMissionSession(
  summary: GrowthMissionControlSummary,
  actionBundle: MissionControlActionBundle,
): MissionSession {
  const id = `ms-${summary.createdAt.replace(/[^0-9A-Za-z-]/g, "").slice(0, 24)}`;
  const steps: MissionSessionStep[] = [];

  if (actionBundle.topAction) {
    const a = actionBundle.topAction;
    steps.push({
      id: `${id}-top`,
      type: "top_action",
      title: a.title.slice(0, 160),
      description: [a.rationale, `Look for: ${a.operatorHint}`, `Done: ${a.doneHint}`].join(" — "),
      targetSurface: a.navTarget,
      actionType: mapActionToStepKind(a.actionType),
      completed: false,
    });
  }

  for (let i = 0; i < summary.todayChecklist.length && steps.length < MAX_STEPS; i++) {
    const line = summary.todayChecklist[i]!;
    steps.push({
      id: `${id}-cl-${i}`,
      type: "checklist",
      title: `Today: ${line.slice(0, 120)}`,
      description: "Work this checklist line in the relevant growth surface — mark done when addressed.",
      actionType: "mark_done",
      completed: false,
    });
  }

  for (let i = 0; i < summary.topRisks.length && steps.length < MAX_STEPS; i++) {
    const r = summary.topRisks[i]!;
    steps.push({
      id: `${id}-risk-${i}`,
      type: "risk_review",
      title: `Review risk: ${r.title.slice(0, 100)}`,
      description: `${r.why.slice(0, 220)} (${r.source}, ${r.severity})`,
      actionType: "inspect",
      completed: false,
    });
  }

  const topNav = actionBundle.topAction?.navTarget;
  for (const a of actionBundle.actionItems) {
    if (steps.length >= MAX_STEPS) break;
    if (topNav && a.navTarget === topNav) continue;
    steps.push({
      id: `${id}-act-${a.id}`,
      type: "navigation",
      title: a.title.slice(0, 160),
      description: a.rationale,
      targetSurface: a.navTarget,
      actionType: mapActionToStepKind(a.actionType),
      completed: false,
    });
  }

  return {
    id,
    startedAt: new Date().toISOString(),
    status: "active",
    topActionTitle: actionBundle.topAction?.title,
    checklistItems: summary.todayChecklist.slice(0, 6),
    completedItemIds: [],
    steps,
  };
}

export function summarizeMissionSession(session: MissionSession): MissionSessionSummary {
  const completed = session.steps.filter((s) => s.completed).length;
  return {
    sessionId: session.id,
    topActionTitle: session.topActionTitle,
    totalSteps: session.steps.length,
    completedSteps: completed,
    remainingSteps: session.steps.length - completed,
    status: session.status,
  };
}
