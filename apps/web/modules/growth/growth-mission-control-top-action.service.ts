/**
 * Primary operator action — highest urgency / clearest step; list excludes duplicate of top.
 */

import type { MissionControlActionItem } from "./growth-mission-control-action.types";

const PRIORITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

const SOURCE_ORDER: Record<string, number> = {
  focus: 6,
  risk: 5,
  review: 4,
  note: 3,
  checklist: 2,
};

function sortKey(a: MissionControlActionItem): number {
  const p = PRIORITY_ORDER[a.priority] ?? 0;
  const s = SOURCE_ORDER[a.source] ?? 0;
  return p * 100 + s;
}

/** Dedupe by navTarget — keep highest-sort item first. */
export function rankMissionControlActions(items: MissionControlActionItem[]): MissionControlActionItem[] {
  const byTarget = new Map<string, MissionControlActionItem>();
  const sorted = [...items].sort((a, b) => {
    const d = sortKey(b) - sortKey(a);
    if (d !== 0) return d;
    return a.id.localeCompare(b.id);
  });
  for (const it of sorted) {
    const k = it.navTarget;
    if (!byTarget.has(k)) byTarget.set(k, it);
  }
  return [...byTarget.values()].sort((a, b) => {
    const d = sortKey(b) - sortKey(a);
    if (d !== 0) return d;
    return a.id.localeCompare(b.id);
  });
}

export function pickMissionControlTopAndRest(
  ranked: MissionControlActionItem[],
  maxRest: number,
): { topAction?: MissionControlActionItem; rest: MissionControlActionItem[] } {
  if (ranked.length === 0) return { topAction: undefined, rest: [] };
  const topAction = ranked[0];
  const rest = ranked.slice(1, 1 + maxRest);
  return { topAction, rest };
}
