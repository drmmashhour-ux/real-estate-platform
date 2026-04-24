import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import {
  buildMemoryPromptBlockForFormKey,
  getDraftPersonalizationForUser,
  personalizationToPromptFragment,
} from "@/modules/ai-memory";
import { buildAiDraftSystemPrompt, buildAiDraftUserPrompt } from "@/modules/ai-drafting-correction/aiDraftPrompt";
import { AI_MISSING_FACT_MARKER } from "@/modules/ai-drafting-correction/aiSuggestionEngine";
import { reviewDraftForRisks } from "@/modules/ai-drafting-correction/aiRiskReviewer";
import type { AiDraftInput, AiDraftOutput, TurboDraftSection } from "@/modules/ai-drafting-correction/types";
import { computeTurboDraftStatusFromFindings } from "@/modules/ai-drafting-correction/turbo-draft-gate";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function markMissingFactsInSection(body: string, answers: Record<string, unknown> | undefined): { text: string; missing: string[] } {
  const missing: string[] = [];
  if (!answers) return { text: body, missing };
  let text = body;
  for (const [k, v] of Object.entries(answers)) {
    if (v === "" || v === null || v === undefined) {
      missing.push(k);
      if (!text.includes(AI_MISSING_FACT_MARKER)) {
        text = `${text}\n\n${AI_MISSING_FACT_MARKER} (${k})`;
      }
    }
  }
  return { text, missing };
}

function deterministicPolishSections(input: AiDraftInput): { sections: TurboDraftSection[]; missing: string[] } {
  const missing: string[] = [];
  const sections = input.draftSections.map((s) => {
    const raw = (s.bodyText ?? stripHtml(s.bodyHtml ?? "")).replace(/\s+/g, " ").trim();
    const marked = markMissingFactsInSection(raw, input.answers);
    missing.push(...marked.missing);
    return {
      ...s,
      bodyText: marked.text,
    };
  });
  return { sections, missing: [...new Set(missing)] };
}

async function openAiPolish(input: AiDraftInput, base: TurboDraftSection[]): Promise<TurboDraftSection[] | null> {
  if (!isOpenAiConfigured() || !openai || process.env.AI_DRAFTING_LLM_GENERATE !== "1") {
    return null;
  }
  try {
    const memoryBlock = await buildMemoryPromptBlockForFormKey(input.formKey);
    const personalization = await getDraftPersonalizationForUser(input.userId);
    const personalizationFragment = personalizationToPromptFragment(personalization);
    const user = buildAiDraftUserPrompt({
      formKey: input.formKey,
      locale: input.locale,
      sectionsJson: JSON.stringify(base.map((s) => ({ sectionKey: s.sectionKey, title: s.title, bodyText: s.bodyText }))),
      noticesJson: JSON.stringify(input.notices ?? []),
      answersJson: JSON.stringify(input.answers ?? {}),
    });
    const res = await openai.chat.completions.create({
      model: process.env.AI_DRAFTING_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.15,
      messages: [
        {
          role: "system",
          content: buildAiDraftSystemPrompt(memoryBlock || undefined, personalizationFragment || undefined),
        },
        { role: "user", content: user.slice(0, 14000) },
      ],
      response_format: { type: "json_object" },
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      improvedSections?: Array<{ sectionKey: string; bodyText: string }>;
    };
    if (!Array.isArray(parsed.improvedSections)) return null;
    const byKey = new Map(parsed.improvedSections.map((x) => [x.sectionKey, x.bodyText]));
    return base.map((s) => ({
      ...s,
      bodyText: byKey.get(s.sectionKey) ?? s.bodyText,
    }));
  } catch {
    return null;
  }
}

export async function generateAiDraft(input: AiDraftInput): Promise<AiDraftOutput> {
  const findings = await reviewDraftForRisks(input);
  const turboDraftStatus = computeTurboDraftStatusFromFindings(findings);
  const det = deterministicPolishSections(input);
  const llm = await openAiPolish(input, det.sections);
  const improvedSections = llm ?? det.sections;
  const modelUsed = llm ? "openai" : "deterministic";
  const warnings: string[] = [];
  if (!llm && isOpenAiConfigured()) {
    warnings.push("OpenAI drafting disabled or AI_DRAFTING_LLM_GENERATE not set to 1; used deterministic polish only.");
  }
  const improvedHtml =
    input.turboDraft?.assembledHtml ??
    improvedSections.map((s) => `<section data-key="${s.sectionKey}"><h2>${s.title ?? ""}</h2><p>${(s.bodyText ?? "").replace(/\n/g, "<br/>")}</p></section>`).join("\n");

  return {
    draftId: input.draftId,
    improvedSections,
    improvedHtml,
    missingFactMarkers: det.missing,
    findings,
    turboDraftStatus,
    modelUsed,
    warnings,
  };
}
