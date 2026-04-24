import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { runDeterministicCorrectionRules } from "@/modules/ai-drafting-correction/aiCorrectionRules";
import type { AiDraftInput, AiRiskFinding } from "@/modules/ai-drafting-correction/types";

/**
 * Optional LLM pass — must not remove or downgrade deterministic findings.
 */
async function optionalLlmRiskPass(input: AiDraftInput, deterministic: AiRiskFinding[]): Promise<AiRiskFinding[]> {
  if (!isOpenAiConfigured() || !openai || process.env.AI_DRAFTING_LLM_REVIEW !== "1") {
    return [];
  }

  const sample = input.draftSections
    .map((s) => `${s.sectionKey}: ${(s.bodyText ?? s.bodyHtml ?? "").slice(0, 2000)}`)
    .join("\n");

  try {
    const res = await openai.chat.completions.create({
      model: process.env.AI_DRAFTING_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You flag drafting risks in Québec real estate French text. Output JSON only: { "findings": Array<{ "findingKey", "severity": "INFO"|"WARNING"|"CRITICAL", "sectionKey"?: string, "messageFr", "messageEn", "suggestedFixFr"?: string, "suggestedFixEn"?: string, "blocking": boolean }> }.
Never claim legal validity. Never duplicate obvious deterministic checks. Max 8 findings.`,
        },
        { role: "user", content: sample.slice(0, 12000) },
      ],
      response_format: { type: "json_object" },
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { findings?: AiRiskFinding[] };
    if (!Array.isArray(parsed.findings)) return [];
    return parsed.findings.filter((f) => f.findingKey && f.messageFr && f.messageEn && f.severity);
  } catch {
    return [];
  }
}

function mergeFindings(deterministic: AiRiskFinding[], llm: AiRiskFinding[]): AiRiskFinding[] {
  const keys = new Set(deterministic.map((d) => d.findingKey));
  const out = [...deterministic];
  for (const f of llm) {
    if (keys.has(f.findingKey)) continue;
    out.push(f);
  }
  return out;
}

export async function reviewDraftForRisks(input: AiDraftInput): Promise<AiRiskFinding[]> {
  const deterministic = runDeterministicCorrectionRules(input);
  const llm = await optionalLlmRiskPass(input, deterministic);
  return mergeFindings(deterministic, llm);
}
