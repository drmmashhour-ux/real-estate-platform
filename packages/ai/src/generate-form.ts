import { retrieveDraftingSources } from "@/lib/ai/retrieval";
import { buildDraftingPrompt } from "@/lib/ai/drafting-engine";
import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import { runInternalDraftGeneration } from "@/lib/ai/internal-draft-runner";
import type { DraftingContextChunk } from "@/lib/ai/retrieve";
import { validateDraftWithFormType } from "@/lib/compliance/draft-validation";
import { checkConsistency } from "@/lib/compliance/draft-consistency";

export type FormDraftPipelineResult = {
  fields: Record<string, unknown>;
  missingFields: string[];
  warnings: string[];
  sourceUsed: unknown[];
  sourcesRetrieved: number;
  promptUsed: boolean;
};

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(text) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Retrieval → strict prompt → optional JSON completion (OpenAI) → deterministic fallback.
 */
export async function generateFormDraft(input: {
  formType: string;
  data: Record<string, unknown>;
}): Promise<FormDraftPipelineResult> {
  const sources = await retrieveDraftingSources({
    query: input.formType,
    formType: input.formType,
  });

  const chunks: DraftingContextChunk[] = sources.map((s) => ({
    sourceKey: s.source,
    content: s.content,
    confidence: s.confidence,
  }));

  const deterministic = runInternalDraftGeneration({
    formType: input.formType,
    facts: input.data,
    sources: chunks,
  });

  if (!sources.length) {
    return {
      fields: deterministic.fields,
      missingFields: [],
      warnings: ["No approved drafting sources retrieved — ingest PDFs or broaden query."],
      sourceUsed: [],
      sourcesRetrieved: 0,
      promptUsed: false,
    };
  }

  const prompt = buildDraftingPrompt({
    formType: input.formType,
    retrievedSources: sources,
    data: input.data,
  });

  let promptUsed = false;
  let fields = { ...deterministic.fields };
  let missingFields: string[] = [];
  let warnings: string[] = [];
  let sourceUsed: unknown[] = [];

  if (isOpenAiConfigured() && openai) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.15,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Output only valid JSON per the user schema. No markdown fences.",
        },
        { role: "user", content: prompt },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim();
    const parsed = text ? parseJsonObject(text) : null;
    if (parsed) {
      promptUsed = true;
      if (parsed.fields && typeof parsed.fields === "object" && !Array.isArray(parsed.fields)) {
        fields = { ...(parsed.fields as Record<string, unknown>) };
      }
      missingFields = asStringArray(parsed.missingFields);
      warnings = asStringArray(parsed.warnings);
      sourceUsed = Array.isArray(parsed.sourceUsed) ? parsed.sourceUsed : [];
    } else {
      warnings.push("LLM returned empty or non-JSON — using deterministic assembly.");
    }
  } else {
    warnings.push("OpenAI not configured — deterministic assembly only.");
  }

  return {
    fields,
    missingFields,
    warnings,
    sourceUsed,
    sourcesRetrieved: sources.length,
    promptUsed,
  };
}

/** Step 6 — block finalize when gates fail (use before signature / release). */
export function assertDraftReviewGates(input: {
  draft: { missingFields?: string[] };
  validation: { valid: boolean };
  consistency: { valid: boolean };
}): void {
  if (input.draft.missingFields && input.draft.missingFields.length > 0) {
    throw new Error("REVIEW_REQUIRED_MISSING_FIELDS");
  }
  if (!input.validation.valid) {
    throw new Error("VALIDATION_FAILED");
  }
  if (!input.consistency.valid) {
    throw new Error("DATA_CONFLICT");
  }
}

/** Convenience: generate → validate → listing consistency → optional assert. */
export async function generateAndValidateFormDraft(input: {
  formType: string;
  data: Record<string, unknown>;
  listing?: { address?: string | null };
  assertGates?: boolean;
}) {
  const draft = await generateFormDraft({
    formType: input.formType,
    data: input.data,
  });
  const validation = validateDraftWithFormType({ formType: input.formType, fields: draft.fields });
  const consistency = checkConsistency({
    listing: input.listing,
    draft: { fields: draft.fields },
  });
  if (input.assertGates) {
    assertDraftReviewGates({ draft, validation, consistency });
  }
  return { draft, validation, consistency };
}
