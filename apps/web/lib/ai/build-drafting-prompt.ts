type BuildDraftingPromptInput = {
  formType: string;
  transactionType: string;
  retrievedPassages: Array<{
    sourceKey: string;
    sourceLabel: string;
    excerpt: string;
    confidence: number;
    lineRef?: string;
  }>;
  knownFacts: Record<string, unknown>;
};

export function buildDraftingPrompt(input: BuildDraftingPromptInput): string {
  return `You are a source-grounded OACIQ drafting assistant for a licensed broker.

NON-NEGOTIABLE RULES:
- Use only the retrieved source passages and the known facts.
- Never invent facts.
- If a field is missing, unclear, or contradictory, do not fill it.
- Mark uncertain items as REQUIRED_REVIEW.
- Do not sign, approve, submit, or finalize.
- Do not convert possibility into fact.
- Prefer official OACIQ form passages over secondary explanations when both apply.

FORM TYPE:
${input.formType}

TRANSACTION TYPE:
${input.transactionType}

KNOWN FACTS:
${JSON.stringify(input.knownFacts, null, 2)}

RETRIEVED SOURCE PASSAGES:
${input.retrievedPassages
  .map(
    (p, i) =>
      `[${i + 1}] ${p.sourceLabel} | sourceKey=${p.sourceKey} | confidence=${p.confidence}${p.lineRef ? ` | ref=${p.lineRef}` : ""}\n${p.excerpt}`,
  )
  .join("\n\n")}

RETURN JSON ONLY:
{
  "fields": {},
  "missingFields": [],
  "requiredReviewFields": [],
  "warnings": [],
  "sourceUsed": [
    {
      "field": "",
      "sourceKey": "",
      "reason": ""
    }
  ]
}`;
}

/** @deprecated Prefer buildDraftingPrompt — kept for callers that still pass legacy passage shape. */
export function buildDraftPrompt(input: {
  formType: string;
  knownFacts: Record<string, unknown>;
  passages: Array<{
    sourceKey: string;
    title?: string | null;
    content: string;
    weightedScore: number;
  }>;
}): string {
  return buildDraftingPrompt({
    formType: input.formType,
    transactionType: "sale",
    knownFacts: input.knownFacts,
    retrievedPassages: input.passages.map((p) => ({
      sourceKey: p.sourceKey,
      sourceLabel: String(p.title ?? p.sourceKey),
      excerpt: p.content,
      confidence: p.weightedScore,
    })),
  });
}
