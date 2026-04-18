/**
 * Ordering and capping for role priorities — explicit, no fabricated scoring.
 */
import type { CommandCenterRolePriority } from "./company-command-center-v3.types";

export function capPriorities(items: CommandCenterRolePriority[], max: number): CommandCenterRolePriority[] {
  return items.filter((x) => x.label.trim().length > 0).slice(0, max);
}

export function stringsToPriorities(ids: string[], labels: string[]): CommandCenterRolePriority[] {
  const out: CommandCenterRolePriority[] = [];
  const n = Math.min(ids.length, labels.length);
  for (let i = 0; i < n; i++) {
    const label = labels[i]?.trim();
    if (!label) continue;
    out.push({ id: ids[i] ?? `p-${i}`, label, rationale: null });
  }
  return out;
}

export function mergeUniqueStrings(a: string[], b: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of [...a, ...b]) {
    const t = x.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}
