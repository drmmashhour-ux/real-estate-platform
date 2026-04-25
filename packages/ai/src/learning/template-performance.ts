import { prisma } from "@/lib/db";
import type { OutcomeType } from "./feedback-score";
import { templatesForAutopilotRule } from "./autopilot-template-catalog";
import { getHostTemplateBoostsForRule, HOST_PROFILE_WEIGHT_MAX, HOST_PROFILE_WEIGHT_MIN } from "./host-behavior";

const MIN_IMPRESSIONS_FOR_RANKING = 5;

export function extractAutopilotTemplateKey(payload: unknown): string | null {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return null;
  const k = (payload as { autopilotTemplateKey?: unknown }).autopilotTemplateKey;
  return typeof k === "string" && k.length > 0 ? k : null;
}

/** Pure selection for tests — picks best template by success rate with min impressions. */
export function selectBestTemplateKey(
  templates: readonly string[],
  rows: ReadonlyArray<{ templateKey: string; impressions: number; successes: number }>,
  minImpressions = MIN_IMPRESSIONS_FOR_RANKING
): { templateKey: string; usedFallback: boolean } {
  if (templates.length === 0) {
    throw new Error("templates must be non-empty");
  }
  const defaultKey = templates[0];
  const map = new Map(rows.map((r) => [r.templateKey, r]));
  let bestKey = defaultKey;
  let bestRate = -1;
  let bestImp = -1;
  let anyQualified = false;

  for (const key of templates) {
    const r = map.get(key);
    const imp = r?.impressions ?? 0;
    if (imp < minImpressions) continue;
    anyQualified = true;
    const rate = imp > 0 ? r!.successes / imp : 0;
    if (rate > bestRate || (rate === bestRate && imp > bestImp)) {
      bestRate = rate;
      bestKey = key;
      bestImp = imp;
    }
  }

  if (!anyQualified) {
    return { templateKey: defaultKey, usedFallback: true };
  }
  return { templateKey: bestKey, usedFallback: false };
}

function clampHostBoost(n: number): number {
  return Math.min(HOST_PROFILE_WEIGHT_MAX, Math.max(HOST_PROFILE_WEIGHT_MIN, n));
}

/**
 * Combines global success rate with per-host template preference multipliers.
 */
export function selectBestTemplateKeyWithHostBoost(
  templates: readonly string[],
  rows: ReadonlyArray<{ templateKey: string; impressions: number; successes: number }>,
  hostBoostByKey: Record<string, number>,
  minImpressions = MIN_IMPRESSIONS_FOR_RANKING
): { templateKey: string; usedFallback: boolean } {
  if (templates.length === 0) {
    throw new Error("templates must be non-empty");
  }
  const defaultKey = templates[0];
  const map = new Map(rows.map((r) => [r.templateKey, r]));
  let bestKey = defaultKey;
  let bestCombined = -1;
  let bestImp = -1;
  let anyQualified = false;

  for (const key of templates) {
    const r = map.get(key);
    const imp = r?.impressions ?? 0;
    const boost = clampHostBoost(hostBoostByKey[key] ?? 1);
    const globalRate = imp >= minImpressions && imp > 0 ? r!.successes / imp : 0.5;
    const combined = globalRate * boost;
    if (imp >= minImpressions) {
      anyQualified = true;
      if (combined > bestCombined || (combined === bestCombined && imp > bestImp)) {
        bestCombined = combined;
        bestKey = key;
        bestImp = imp;
      }
    }
  }

  if (!anyQualified) {
    let bk = defaultKey;
    let bs = -1;
    for (const key of templates) {
      const boost = clampHostBoost(hostBoostByKey[key] ?? 1);
      if (boost > bs) {
        bs = boost;
        bk = key;
      }
    }
    return { templateKey: bk, usedFallback: true };
  }
  return { templateKey: bestKey, usedFallback: false };
}

export async function getBestTemplate(
  ruleName: string,
  templates: readonly string[],
  hostId?: string | null
): Promise<{ templateKey: string; usedFallback: boolean }> {
  const list = templates.length > 0 ? templates : [...templatesForAutopilotRule(ruleName)];
  if (list.length === 0) {
    return { templateKey: "host_autopilot_default", usedFallback: true };
  }
  const rows = await prisma.aiTemplatePerformance.findMany({
    where: { ruleName, templateKey: { in: [...list] } },
    select: { templateKey: true, impressions: true, successes: true },
  });
  const hostBoosts = hostId ? await getHostTemplateBoostsForRule(hostId, ruleName) : {};
  if (Object.keys(hostBoosts).length === 0) {
    return selectBestTemplateKey(list, rows);
  }
  return selectBestTemplateKeyWithHostBoost(list, rows, hostBoosts);
}

export async function recordTemplateImpression(templateKey: string, ruleName: string): Promise<void> {
  await prisma.aiTemplatePerformance.upsert({
    where: {
      templateKey_ruleName: { templateKey, ruleName },
    },
    create: {
      templateKey,
      ruleName,
      impressions: 1,
      successes: 0,
      failures: 0,
    },
    update: {
      impressions: { increment: 1 },
    },
  });
}

export async function recordTemplateOutcome(
  templateKey: string,
  ruleName: string,
  outcomeType: OutcomeType
): Promise<void> {
  const success =
    outcomeType === "approved" || outcomeType === "applied" || outcomeType === "success";
  const failure =
    outcomeType === "rejected" || outcomeType === "reverted" || outcomeType === "failure";
  if (!success && !failure) return;

  await prisma.aiTemplatePerformance.upsert({
    where: {
      templateKey_ruleName: { templateKey, ruleName },
    },
    create: {
      templateKey,
      ruleName,
      impressions: 0,
      successes: success ? 1 : 0,
      failures: failure ? 1 : 0,
    },
    update: success
      ? { successes: { increment: 1 } }
      : { failures: { increment: 1 } },
  });
}

/** Pick template, record impression; use before showing a recommendation or approval. */
export async function reserveAutopilotTemplate(ruleName: string, hostId: string): Promise<string> {
  const templates = templatesForAutopilotRule(ruleName);
  const { templateKey } = await getBestTemplate(ruleName, templates, hostId);
  await recordTemplateImpression(templateKey, ruleName);
  return templateKey;
}
