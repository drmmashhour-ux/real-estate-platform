import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { buildAlertExplanationPrompt } from "@/lib/ai/alerts";
import { buildAlertSuggestedActions } from "@/lib/alerts/actions";
import { buildAlertContext } from "@/lib/alerts/context";
import {
  assertAlertAnalysisOutputSafe,
  assertAlertContextPresent,
  AlertAnalysisSafetyError,
} from "@/lib/alerts/safety";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const MODEL = process.env.ALERT_EXPLANATION_AI_MODEL?.trim() || "gpt-4o-mini";

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function clamp01(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, n));
}

function mergeSuggestedActions(ai: string[], deterministic: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [...ai, ...deterministic]) {
    const t = s.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  if (out.length < 3) {
    for (const s of deterministic) {
      const t = s.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
  }
  return out.slice(0, 12);
}

export function scheduleAlertAnalysis(alertId: string, actorUserId?: string | null) {
  if (process.env.ALERT_AI_ANALYSIS_ON_CREATE !== "true") return;
  void analyzeAlert(alertId, { actorUserId: actorUserId ?? undefined }).catch(() => {});
}

export async function analyzeAlert(
  alertId: string,
  opts?: { actorUserId?: string | null },
) {
  const ctx = await buildAlertContext(alertId);
  assertAlertContextPresent(ctx.alert);

  const prompt = buildAlertExplanationPrompt({
    alert: {
      id: ctx.alert.id,
      alertType: ctx.alert.alertType,
      severity: ctx.alert.severity,
      title: ctx.alert.title,
      message: ctx.alert.message,
      metadata: ctx.alert.metadata,
      status: ctx.alert.status,
      createdAt: ctx.alert.createdAt,
    },
    reference: ctx.listing,
    dealAnalysis: ctx.dealAnalysis,
    extraContext: {
      watchlistSnapshot: ctx.watchlistSnapshot,
      disclaimer: "Advisory only; human decides; no auto-execution.",
    },
  });

  const deterministic = buildAlertSuggestedActions(ctx.alert.alertType);

  let summary: string | null = null;
  let whyItMatters: string | null = null;
  let suggestedActions: string[] = deterministic;
  let confidence: number | null = 0.45;
  let riskFlags: string[] = [];
  let assumptions: string[] = [];

  const client = openai;
  if (isOpenAiConfigured() && client) {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You output only valid JSON for alert explanations. Never promise returns or auto-actions.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    if (raw) {
      assertAlertAnalysisOutputSafe(raw);
      const cleaned = stripJsonFences(raw);
      assertAlertAnalysisOutputSafe(cleaned);
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      summary = typeof parsed.summary === "string" ? parsed.summary : null;
      whyItMatters = typeof parsed.whyItMatters === "string" ? parsed.whyItMatters : null;
      suggestedActions = mergeSuggestedActions(asStringArray(parsed.suggestedActions), deterministic);
      confidence = clamp01(parsed.confidence);
      riskFlags = asStringArray(parsed.riskFlags);
      assumptions = asStringArray(parsed.assumptions);
    }
  } else {
    suggestedActions = mergeSuggestedActions([], deterministic);
    summary = ctx.alert.title;
    whyItMatters =
      "OpenAI is not configured — showing template actions only. Enable OPENAI_KEY for full explanations.";
    confidence = 0.25;
    riskFlags = ["LLM unavailable; review raw alert and listing manually."];
  }

  const row = await prisma.alertAIAnalysis.upsert({
    where: { alertId },
    create: {
      alertId,
      summary,
      whyItMatters,
      suggestedActions: suggestedActions as unknown as Prisma.InputJsonValue,
      confidence,
      riskFlags: riskFlags as unknown as Prisma.InputJsonValue,
      assumptions: assumptions as unknown as Prisma.InputJsonValue,
    },
    update: {
      summary,
      whyItMatters,
      suggestedActions: suggestedActions as unknown as Prisma.InputJsonValue,
      confidence,
      riskFlags: riskFlags as unknown as Prisma.InputJsonValue,
      assumptions: assumptions as unknown as Prisma.InputJsonValue,
    },
  });

  await recordAuditEvent({
    actorUserId: opts?.actorUserId ?? undefined,
    action: "AI_ALERT_ANALYSIS_GENERATED",
    payload: { alertId, analysisId: row.id },
  }).catch(() => {});

  return row;
}
