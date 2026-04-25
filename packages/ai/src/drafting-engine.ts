export type DraftingEngineSource = { source: string; content: string; confidence?: number };

export function buildDraftingPrompt(input: {
  formType: string;
  retrievedSources: DraftingEngineSource[];
  data: Record<string, unknown>;
}): string {
  return `
You are a compliance-grade real estate drafting assistant.

STRICT RULES:
- Only use provided sources and data.
- Never invent facts.
- If data is missing → mark as REQUIRED_REVIEW.
- If unsure → mark as UNCERTAIN.
- Use legally neutral and structured language.
- Do NOT finalize, approve, or sign anything.

FORM TYPE: ${input.formType}

RETRIEVED SOURCES:
${input.retrievedSources.map((s) => `- ${s.source}: ${s.content}`).join("\n")}

DATA:
${JSON.stringify(input.data, null, 2)}

RETURN JSON ONLY:

{
  "fields": {},
  "missingFields": [],
  "warnings": [],
  "sourceUsed": []
}
`.trim();
}
