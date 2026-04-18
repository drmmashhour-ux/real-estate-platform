/**
 * Structured diff hints between PP and CP document snapshots — only when structuredData exists on documents.
 */
export function generateCpDeltaHints(input: {
  ppStructured?: Record<string, unknown> | null;
  cpStructured?: Record<string, unknown> | null;
}): { changedKeys: string[]; notes: string[] } {
  const pp = input.ppStructured ?? {};
  const cp = input.cpStructured ?? {};
  const keys = new Set([...Object.keys(pp), ...Object.keys(cp)]);
  const changedKeys: string[] = [];
  for (const k of keys) {
    if (JSON.stringify(pp[k]) !== JSON.stringify(cp[k])) changedKeys.push(k);
  }
  const notes: string[] = [];
  if (changedKeys.length === 0) {
    notes.push("No structured PP/CP snapshots on file — diff unavailable until drafts are stored on deal documents.");
  }
  return { changedKeys, notes };
}
