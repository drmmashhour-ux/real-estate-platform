import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { logError } from "@/lib/logger";
import { assertNoAutoActionLanguage, sanitizeContext } from "./ai-guardrails";
import { persistAiInteractionLog } from "./ai-audit-log";
import { buildMessagesForHub, offlineTextForHub } from "./hub-router";
import type { AiIntent, AiHub, RunAiTaskParams, RunAiTaskResult } from "./types";

const MODEL = "gpt-4o-mini";

async function completeOpenAi(system: string, user: string): Promise<{ text: string; model: string }> {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.35,
    max_tokens: 1200,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user.slice(0, 24000) },
    ],
  });
  const text = (completion.choices[0]?.message?.content ?? "").trim();
  return { text, model: MODEL };
}

/** Primary entry: one completion + audit + guardrails. */
export async function runAiTask(params: RunAiTaskParams): Promise<RunAiTaskResult> {
  const ctx = sanitizeContext(params.context);
  const { system, user } = buildMessagesForHub(params.hub, params.intent, params.feature, ctx);

  if (!isOpenAiConfigured()) {
    const text = assertNoAutoActionLanguage(offlineTextForHub(params.hub, params.feature, ctx));
    const logId = await persistAiInteractionLog({
      userId: params.userId,
      role: params.role,
      hub: params.hub,
      feature: params.feature,
      intent: params.intent,
      context: ctx,
      outputText: text,
      source: "rules",
      model: null,
      legalContext: params.legalContext,
    });
    return { text, source: "rules", logId, model: null };
  }

  try {
    const { text: raw, model } = await completeOpenAi(system, user);
    const text = assertNoAutoActionLanguage(raw || offlineTextForHub(params.hub, params.feature, ctx));
    const logId = await persistAiInteractionLog({
      userId: params.userId,
      role: params.role,
      hub: params.hub,
      feature: params.feature,
      intent: params.intent,
      context: ctx,
      outputText: text,
      source: "openai",
      model,
      legalContext: params.legalContext,
    });
    return { text, source: "openai", logId, model };
  } catch (e) {
    logError("[runAiTask] openai", e);
    const text = assertNoAutoActionLanguage(offlineTextForHub(params.hub, params.feature, ctx));
    const logId = await persistAiInteractionLog({
      userId: params.userId,
      role: params.role,
      hub: params.hub,
      feature: params.feature,
      intent: params.intent,
      context: ctx,
      outputText: text,
      source: "rules",
      model: null,
      legalContext: params.legalContext,
    });
    return { text, source: "rules", logId, model: null };
  }
}

/** Thin wrappers — same pipeline, intent fixed. */
export function generateSuggestion(p: Omit<RunAiTaskParams, "intent">) {
  return runAiTask({ ...p, intent: "suggestion" });
}
export function generateSummary(p: Omit<RunAiTaskParams, "intent">) {
  return runAiTask({ ...p, intent: "summary" });
}
export function generateDraft(p: Omit<RunAiTaskParams, "intent">) {
  return runAiTask({ ...p, intent: "draft" });
}
export function explainSection(p: Omit<RunAiTaskParams, "intent">) {
  return runAiTask({ ...p, intent: "explain" });
}
export function analyzeData(p: Omit<RunAiTaskParams, "intent">) {
  return runAiTask({ ...p, intent: "analyze" });
}
export function detectRisk(p: Omit<RunAiTaskParams, "intent">) {
  return runAiTask({ ...p, intent: "risk" });
}
