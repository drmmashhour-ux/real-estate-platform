type Row = {
  score: number;
  contentItem: { topic: string; draftPayload?: unknown };
};

export function optimizeHooks(scored: Row[]): string[] {
  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, 5);
  const hooks: string[] = [];
  for (const r of top) {
    const draft = r.contentItem.draftPayload as { hook?: string } | undefined;
    if (draft?.hook) hooks.push(`Reuse hook pattern: “${draft.hook.slice(0, 80)}…”`);
  }
  if (!hooks.length) hooks.push("Test 3 hook variants: fear, curiosity, checklist.");
  return hooks.slice(0, 8);
}
