import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { buildAiRewriteSystemPrompt } from "@/modules/ai-drafting-correction/aiDraftPrompt";
import type { AiRewriteRequest, AiRewriteResult } from "@/modules/ai-drafting-correction/types";
import { restoreProtected, stripProtectedForRewrite } from "@/modules/ai-drafting-correction/notice-protect";

function deterministicRewrite(text: string, instruction: AiRewriteRequest["instruction"]): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (instruction === "shorten") {
    return collapsed.length > 400 ? `${collapsed.slice(0, 397)}…` : collapsed;
  }
  if (instruction === "formalize") {
    return collapsed.replace(/\b(on|nous on)\b/gi, "l’on");
  }
  return collapsed;
}

export async function rewriteSection(request: AiRewriteRequest): Promise<AiRewriteResult> {
  const { stripped, spans } = stripProtectedForRewrite(request.sourceText);
  const warnings: string[] = [];
  if (spans.length) {
    warnings.push("Contract Brain / locked notice blocks were preserved verbatim.");
  }

  if (!isOpenAiConfigured() || !openai || process.env.AI_DRAFTING_LLM_REWRITE !== "1") {
    const rewritten = deterministicRewrite(stripped, request.instruction);
    return {
      rewrittenText: restoreProtected(rewritten, spans),
      modelUsed: "deterministic",
      protectedNoticesRestored: spans.length > 0,
      warnings,
    };
  }

  try {
    const res = await openai.chat.completions.create({
      model: process.env.AI_DRAFTING_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: buildAiRewriteSystemPrompt(request.instruction) },
        { role: "user", content: stripped.slice(0, 12000) },
      ],
      response_format: { type: "json_object" },
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as { rewrittenText?: string; warnings?: string[] };
    const rewritten = typeof parsed.rewrittenText === "string" ? parsed.rewrittenText : deterministicRewrite(stripped, request.instruction);
    if (Array.isArray(parsed.warnings)) warnings.push(...parsed.warnings);
    return {
      rewrittenText: restoreProtected(rewritten, spans),
      modelUsed: "openai",
      protectedNoticesRestored: spans.length > 0,
      warnings,
    };
  } catch {
    const rewritten = deterministicRewrite(stripped, request.instruction);
    warnings.push("OpenAI rewrite failed; used deterministic fallback.");
    return {
      rewrittenText: restoreProtected(rewritten, spans),
      modelUsed: "deterministic",
      protectedNoticesRestored: spans.length > 0,
      warnings,
    };
  }
}
