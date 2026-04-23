import { buildDraftingPrompt } from "@/lib/ai/build-drafting-prompt";
import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import { runInternalDraftGeneration } from "@/lib/ai/internal-draft-runner";
import { retrieveDraftingContextForForm } from "@/lib/ai/retrieve-drafting-context";
import type { RetrievedPassage } from "@/lib/ai/retrieve-drafting-context";
import type { DraftingContextChunk } from "@/lib/ai/retrieve";
import { OACIQ_VIA_MESSAGES } from "@/lib/compliance/oaciq/verify-inform-advise/messages";
import { buildBrokerDocumentContext, formatBrokerSignatureBlock } from "@/lib/investor/deal-loop/broker-context";

export type FieldSourceAttribution = { field: string; sourceKey: string; reason: string };

export type SourceGroundedDraftResult = {
  fields: Record<string, unknown>;
  missingFields: string[];
  requiredReviewFields: string[];
  warnings: string[];
  sourceUsed: FieldSourceAttribution[];
  passages: RetrievedPassage[];
  promptUsed: boolean;
};

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function asSourceUsed(v: unknown): FieldSourceAttribution[] {
  if (!Array.isArray(v)) return [];
  const out: FieldSourceAttribution[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    if (typeof o.field !== "string" || typeof o.sourceKey !== "string") continue;
    out.push({
      field: o.field,
      sourceKey: o.sourceKey,
      reason: typeof o.reason === "string" ? o.reason : "cited",
    });
  }
  return out;
}

function buildDeterministicAttributions(
  fields: Record<string, unknown>,
  passages: RetrievedPassage[],
): FieldSourceAttribution[] {
  const top = passages[0]?.sourceKey ?? "unknown";
  const skip = new Set(["sourceExcerpts", "retrievedAt", "formType"]);
  const out: FieldSourceAttribution[] = [];
  for (const key of Object.keys(fields)) {
    if (skip.has(key)) continue;
    const pk = passages.find((p) => p.content.length > 0)?.sourceKey ?? top;
    out.push({ field: key, sourceKey: pk, reason: "retrieval_top_passage" });
  }
  return out;
}

async function completeJsonDraft(prompt: string): Promise<unknown | null> {
  if (!isOpenAiConfigured() || !openai) return null;
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.15,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a drafting engine. Output only valid JSON matching the user schema. Never add markdown fences.
OACIQ duty — VERIFY → INFORM → ADVISE: do not invent facts; do not give broker-style advice when verification is incomplete; use REQUIRED_REVIEW instead. ${OACIQ_VIA_MESSAGES.verifyBeforeAdviceEn}`,
      },
      { role: "user", content: prompt },
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * Retrieval-first OACIQ drafting: approved passages → optional JSON completion (OpenAI) → deterministic fallback.
 */
export async function generateSourceGroundedDraft(input: {
  formType: string;
  knownFacts: Record<string, unknown>;
  userQuery: string;
  transactionType?: string;
  userId?: string; // Phase 3: Add userId for broker identity injection
}): Promise<SourceGroundedDraftResult> {
  // Phase 3: Broker Identity Injection
  const enrichedFacts = { ...input.knownFacts };
  if (input.userId) {
    try {
      const brokerCtx = await buildBrokerDocumentContext(input.userId);
      enrichedFacts.brokerName = brokerCtx.brokerName;
      enrichedFacts.brokerLicenseNumber = brokerCtx.licenseNumber;
      enrichedFacts.brokerAddress = brokerCtx.fullAddress;
      enrichedFacts.brokerSignatureBlock = formatBrokerSignatureBlock(brokerCtx);
      enrichedFacts.brokerDisclosure = `Real estate broker: ${brokerCtx.brokerName}, OACIQ licence ${brokerCtx.licenseNumber}, ${brokerCtx.fullAddress}`;
    } catch (e) {
      console.warn("[generateSourceGroundedDraft] Broker identity injection failed:", e);
    }
  }

  const passages = await retrieveDraftingContextForForm({
    formType: input.formType,
    query: input.userQuery,
  });

  if (!passages.length) {
    return {
      fields: {},
      missingFields: [],
      requiredReviewFields: ["SOURCE_RETRIEVAL_REQUIRED"],
      warnings: ["No approved drafting sources retrieved."],
      sourceUsed: [],
      passages: [],
      promptUsed: false,
    };
  }

  const chunks: DraftingContextChunk[] = passages.map((p) => ({
    sourceKey: p.sourceKey,
    content: p.content,
    confidence: p.weightedScore,
  }));

  const deterministic = runInternalDraftGeneration({
    formType: input.formType,
    facts: enrichedFacts, // Use enriched facts
    sources: chunks,
  });

  const transactionType = input.transactionType ?? "sale";
  const retrievedPassages = passages.map((p) => ({
    sourceKey: p.sourceKey,
    sourceLabel: String(p.title ?? p.sourceKey),
    excerpt: p.content,
    confidence: p.weightedScore,
  }));

  const prompt = buildDraftingPrompt({
    formType: input.formType,
    transactionType,
    knownFacts: enrichedFacts, // Use enriched facts
    retrievedPassages,
  });

  const llmRaw = await completeJsonDraft(prompt);
  let promptUsed = false;
  let fields = { ...deterministic.fields };
  let missingFields: string[] = [];
  let requiredReviewFields: string[] = [];
  let warnings: string[] = [];
  let sourceUsed: FieldSourceAttribution[] = buildDeterministicAttributions(fields, passages);

  if (llmRaw && typeof llmRaw === "object" && !Array.isArray(llmRaw)) {
    const o = llmRaw as Record<string, unknown>;
    if (o.fields && typeof o.fields === "object" && !Array.isArray(o.fields)) {
      fields = { ...(o.fields as Record<string, unknown>) };
      promptUsed = true;
    }
    missingFields = asStringArray(o.missingFields);
    requiredReviewFields = asStringArray(o.requiredReviewFields);
    warnings = asStringArray(o.warnings);
    const su = asSourceUsed(o.sourceUsed);
    if (su.length > 0) sourceUsed = su;
    else sourceUsed = buildDeterministicAttributions(fields, passages);
  } else {
    warnings.push("LLM_NOT_CONFIGURED_OR_PARSE_FAILED — deterministic assembly only.");
  }

  for (const [k, v] of Object.entries(fields)) {
    if (v === "REQUIRED_REVIEW" && !requiredReviewFields.includes(k)) {
      requiredReviewFields.push(k);
    }
  }

  return {
    fields,
    missingFields,
    requiredReviewFields,
    warnings,
    sourceUsed,
    passages,
    promptUsed,
  };
}
