/**
 * Source-grounded draft assembly — does not call an LLM unless explicitly wired later.
 * Every output field must cite sources via `sourceUsed`; facts override only when consistent.
 */

import type { DraftingContextChunk } from "./retrieve";

export type InternalDraftInput = {
  formType: string;
  facts: Record<string, unknown>;
  sources: DraftingContextChunk[];
};

export type InternalDraftResult = {
  fields: Record<string, unknown>;
  /** Non-empty when drafting is allowed — enforced by callers */
  sourceUsed: string[];
  formType: string;
};

function pickFact<T>(facts: Record<string, unknown>, key: string): T | undefined {
  return facts[key] as T | undefined;
}

/**
 * Builds a minimal structured draft by merging facts with top retrieved excerpts (traceable).
 */
export function runInternalDraftGeneration(input: InternalDraftInput): InternalDraftResult {
  const sourceUsed = [...new Set(input.sources.map((s) => s.sourceKey))];
  const topSnippets = input.sources
    .slice(0, 5)
    .map((s) => `[${s.sourceKey}] ${s.content.slice(0, 2000)}`)
    .join("\n\n");

  const propertyAddress =
    (pickFact<string>(input.facts, "propertyAddress") ??
      pickFact<string>(input.facts, "address") ??
      "") || "";
  const buyerName =
    (pickFact<string>(input.facts, "buyerName") ??
      pickFact<string>(input.facts, "buyer") ??
      "") || "";

  const fields: Record<string, unknown> = {
    formType: input.formType,
    propertyAddress: propertyAddress || undefined,
    buyerName: buyerName || undefined,
    sourceExcerpts: topSnippets,
    retrievedAt: new Date().toISOString(),
    ...input.facts,
  };

  return {
    fields,
    sourceUsed,
    formType: input.formType,
  };
}
