import { buildSuggestionPrompt } from "@/lib/ai/suggestions";
import { buildCopilotContext } from "@/lib/copilot/context";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { DetectedPattern } from "@/lib/suggestions/patterns";
import { detectSuggestionPatterns } from "@/lib/suggestions/patterns";
import {
  assertProactiveAiSuggestionsSafe,
  type ProactiveAiSuggestion,
} from "@/lib/suggestions/safety";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const MODEL = process.env.PROACTIVE_SUGGESTION_AI_MODEL?.trim() || "gpt-4o-mini";

const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function mapPatternTypeToSuggestionType(patternType: string): string {
  switch (patternType) {
    case "saved_search_opportunity":
      return "buy_box";
    case "watchlist_opportunity":
    case "listing_deep_dive":
      return "watchlist";
    case "appraisal_workflow":
      return "appraisal";
    case "portfolio_optimization":
      return "portfolio";
    case "neighborhood_intel":
      return "analysis";
    default:
      return "workflow";
  }
}

function patternsToFallbackSuggestions(patterns: DetectedPattern[]): ProactiveAiSuggestion[] {
  return patterns.slice(0, 5).map((p) => ({
    suggestionType: mapPatternTypeToSuggestionType(p.type),
    priority: p.priority,
    title: p.title,
    message: p.message,
    workflowType:
      p.type === "appraisal_workflow"
        ? "appraisal_review"
        : p.type === "portfolio_optimization"
          ? "compare_deals"
          : p.type === "saved_search_opportunity"
            ? "buy_box_create"
            : p.type === "watchlist_opportunity" || p.type === "listing_deep_dive"
              ? "watchlist_review"
              : p.type === "neighborhood_intel"
                ? "market_intel_digest"
                : null,
    workflowPayload: {
      patternType: p.type,
      relatedEntityType: p.relatedEntityType ?? null,
      relatedEntityId: p.relatedEntityId ?? null,
    },
    rationale: p.rationale,
    relatedEntityType: p.relatedEntityType ?? null,
    relatedEntityId: p.relatedEntityId ?? null,
  }));
}

function parseAiSuggestions(raw: string): ProactiveAiSuggestion[] {
  const cleaned = stripJsonFences(raw);
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  const rawList = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  const out: ProactiveAiSuggestion[] = [];
  for (const item of rawList) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    out.push({
      suggestionType: typeof o.suggestionType === "string" ? o.suggestionType : "workflow",
      priority: typeof o.priority === "string" ? o.priority : "medium",
      title: typeof o.title === "string" ? o.title : "",
      message: typeof o.message === "string" ? o.message : "",
      workflowType: typeof o.workflowType === "string" ? o.workflowType : null,
      workflowPayload: o.workflowPayload,
      rationale: o.rationale,
      relatedEntityType: typeof o.relatedEntityType === "string" ? o.relatedEntityType : null,
      relatedEntityId: typeof o.relatedEntityId === "string" ? o.relatedEntityId : null,
    });
  }
  return out.filter((s) => s.title.length > 0 && s.message.length > 0).slice(0, 5);
}

async function runSuggestionModel(prompt: string): Promise<ProactiveAiSuggestion[]> {
  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    throw new Error("OPENAI_NOT_CONFIGURED");
  }
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.35,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You output only valid JSON. Proactive advisory suggestions only — never autonomous regulated execution.",
      },
      { role: "user", content: prompt },
    ],
  });
  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!raw) throw new Error("EMPTY_PROACTIVE_AI");
  try {
    return parseAiSuggestions(raw);
  } catch {
    throw new Error("INVALID_PROACTIVE_AI_JSON");
  }
}

async function isDuplicateRecent(ownerId: string, title: string): Promise<boolean> {
  const since = new Date(Date.now() - 12 * 3600000);
  const hit = await prisma.lecipmProactiveSuggestion.findFirst({
    where: { ownerId, title, createdAt: { gte: since } },
    select: { id: true },
  });
  return Boolean(hit);
}

async function throttleTooAggressive(ownerType: string, ownerId: string): Promise<boolean> {
  const since = new Date(Date.now() - 3600000);
  const n = await prisma.lecipmProactiveSuggestion.count({
    where: { ownerType, ownerId, createdAt: { gte: since } },
  });
  return n >= 20;
}

export async function generateAutonomousSuggestions(ownerType: string, ownerId: string) {
  const patterns = await detectSuggestionPatterns(ownerType, ownerId);
  if (!patterns.length) {
    return [];
  }

  if (await throttleTooAggressive(ownerType, ownerId)) {
    await recordAuditEvent({
      actorUserId: ownerId,
      action: "PROACTIVE_SUGGESTION_SUPPRESSED",
      payload: { reason: "hourly_rate_limit" },
    });
    return [];
  }

  const context = await buildCopilotContext({
    ownerType,
    ownerId,
    contextType: "global",
  });

  const prompt = buildSuggestionPrompt({ patterns, context });

  let suggestions: ProactiveAiSuggestion[];
  try {
    suggestions = await runSuggestionModel(prompt);
  } catch (e) {
    const msg = (e as Error)?.message ?? "";
    if (msg === "OPENAI_NOT_CONFIGURED" || msg === "INVALID_PROACTIVE_AI_JSON" || msg === "EMPTY_PROACTIVE_AI") {
      suggestions = patternsToFallbackSuggestions(patterns);
    } else {
      throw e;
    }
  }

  if (!suggestions.length) {
    suggestions = patternsToFallbackSuggestions(patterns);
  }

  assertProactiveAiSuggestionsSafe(suggestions);

  const created = [];
  for (const s of suggestions) {
    if (await isDuplicateRecent(ownerId, s.title)) {
      continue;
    }

    const row = await prisma.lecipmProactiveSuggestion.create({
      data: {
        ownerType,
        ownerId,
        suggestionType: s.suggestionType,
        priority: s.priority,
        title: s.title,
        message: s.message,
        workflowType: s.workflowType ?? null,
        workflowPayload:
          s.workflowPayload === undefined || s.workflowPayload === null
            ? undefined
            : (s.workflowPayload as Prisma.InputJsonValue),
        rationale:
          s.rationale === undefined || s.rationale === null
            ? undefined
            : (s.rationale as Prisma.InputJsonValue),
        relatedEntityType: s.relatedEntityType ?? null,
        relatedEntityId: s.relatedEntityId ?? null,
        shown: false,
      },
    });
    created.push(row);

    await recordAuditEvent({
      actorUserId: ownerId,
      action: "PROACTIVE_SUGGESTION_GENERATED",
      payload: { suggestionId: row.id, source: "autonomous_engine" },
    });
  }

  created.sort(
    (a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0)
  );

  return created;
}
