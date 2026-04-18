/**
 * Growth Mission Control — today checklist (advisory only).
 */

import type { GrowthMissionControlBuildContext } from "./growth-mission-control.types";

const MAX_ITEMS = 5;

export type GrowthMissionChecklistOptions = {
  /** When set, checklist lines that only repeat this headline are skipped or shortened. */
  missionFocusTitle?: string;
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function semanticKey(line: string): string {
  const n = norm(line);
  const words = n.split(" ").filter(Boolean);
  return words.slice(0, 10).join(" ");
}

function prefixActionable(line: string): string {
  const t = line.trim();
  if (!t) return t;
  const lower = t.toLowerCase();
  const hasVerb =
    /^(review|follow up|resolve|check|validate|do not promote|confirm|monitor|align|pause|escalate)\b/i.test(
      lower,
    );
  if (hasVerb) return t;
  if (/governance|freeze|blocked|escalation/i.test(lower)) return `Resolve: ${t}`;
  if (/risk|warning|caution/i.test(lower)) return `Check: ${t}`;
  return `Review: ${t}`;
}

function overlapsMissionFocus(line: string, missionTitle?: string): boolean {
  if (!missionTitle?.trim()) return false;
  const a = norm(line);
  const b = norm(missionTitle);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

export function buildGrowthMissionChecklist(
  ctx: GrowthMissionControlBuildContext,
  options?: GrowthMissionChecklistOptions,
): { items: string[]; dedupeEvents: number } {
  const missionTitle = options?.missionFocusTitle?.trim();
  const lines: string[] = [];

  const exec = ctx.executive;
  if (exec?.topPriorities?.length) {
    for (const p of exec.topPriorities.slice(0, 2)) {
      const raw = p.title?.trim();
      if (!raw) continue;
      if (overlapsMissionFocus(raw, missionTitle)) continue;
      lines.push(prefixActionable(raw));
    }
  } else if (exec?.topPriority?.trim()) {
    const raw = exec.topPriority.trim();
    if (!overlapsMissionFocus(raw, missionTitle)) lines.push(prefixActionable(raw));
  }

  const brief = ctx.dailyBrief;
  if (brief?.today?.priorities?.length) {
    for (const item of brief.today.priorities.slice(0, 3)) {
      const raw = item.trim();
      if (!raw) continue;
      if (overlapsMissionFocus(raw, missionTitle)) continue;
      lines.push(prefixActionable(raw));
    }
  }

  const fusion = ctx.fusion;
  if (fusion?.actions?.length) {
    const top = fusion.actions[0];
    const title = top?.title?.trim();
    if (title && !overlapsMissionFocus(title, missionTitle)) {
      lines.push(`Review top fusion action: ${title}`);
    }
  }

  const gov = ctx.governance;
  for (const s of gov?.topRisks?.slice(0, 2) ?? []) {
    const raw = s.title?.trim();
    if (!raw) continue;
    lines.push(`Check governance signal: ${raw}`);
  }
  if (gov?.status === "human_review_required" && gov.humanReviewItems?.length) {
    lines.push(`Resolve: ${gov.humanReviewItems[0]!.trim().slice(0, 140)}`);
  }

  const rd = ctx.responseDesk;
  if (rd && rd.itemCount > 0 && rd.urgentCount > 0) {
    lines.push(
      `Follow up: ${rd.urgentCount} urgent response desk item(s) (${rd.itemCount} total, advisory).`,
    );
  }

  const strat = ctx.strategyBundle?.weeklyPlan;
  if (strat?.priorities?.length) {
    for (const p of strat.priorities.slice(0, 2)) {
      const raw = p.title?.trim();
      if (!raw) continue;
      if (overlapsMissionFocus(raw, missionTitle)) continue;
      lines.push(prefixActionable(`Strategy: ${raw}`));
    }
  }

  const learning = ctx.learningControl;
  if (learning?.state === "monitor" && learning.recommendedActions?.length) {
    const n = learning.recommendedActions.find((x) => /review|pause|hold/i.test(x));
    if (n?.trim()) lines.push(`Validate learning note: ${n.trim().slice(0, 140)}`);
  }

  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const line of lines) {
    const key = semanticKey(line);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(line);
    if (deduped.length >= MAX_ITEMS) break;
  }

  const dedupeEvents = Math.max(0, lines.length - deduped.length);
  return { items: deduped.slice(0, MAX_ITEMS), dedupeEvents };
}
