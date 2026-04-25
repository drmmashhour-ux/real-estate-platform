/**
 * Hard rule: AI / assembly output must cite at least one allowed retrieval source.
 * @throws Error with message `NO_SOURCE_CONTEXT` when missing.
 */
export function assertDraftSourceContext(draft: {
  sourceUsed?: Array<unknown> | null;
}): void {
  const used = draft.sourceUsed;
  if (!used || !Array.isArray(used) || used.length === 0) {
    throw new Error("NO_SOURCE_CONTEXT");
  }
}
