import type { DocDiffResult } from "./doc.types";

export function shallowDiffObjects(before: Record<string, unknown>, after: Record<string, unknown>): DocDiffResult {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: DocDiffResult["changed"] = [];
  for (const k of keys) {
    if (!(k in before)) added.push(k);
    else if (!(k in after)) removed.push(k);
    else if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
      changed.push({ key: k, before: before[k], after: after[k] });
    }
  }
  return { added, removed, changed };
}
