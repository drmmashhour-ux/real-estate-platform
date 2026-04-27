import "server-only";

import type { AdPlatform } from "@/lib/marketing/campaignEnginePure";
import { derivePerformanceMetrics, parseAdPlatform } from "@/lib/marketing/campaignEnginePure";
import { generateAdCopy, type AdAudience } from "@/lib/marketing/adCopyEngine";
import { getCampaignFeedbackInsights } from "@/lib/marketing/campaignFeedback";
import type { CampaignFeedbackInsights } from "@/lib/marketing/campaignFeedbackTypes";
import { extractPatternFromCopy, order87ClassifyGroup } from "@/lib/marketing/campaignLearningPure";
import { getLegacyDB } from "@/lib/db/legacy";
import { writeMarketplaceEvent } from "@/lib/analytics/tracker";

export { extractPatternFromCopy, order87ClassifyGroup } from "@/lib/marketing/campaignLearningPure";

const prisma = getLegacyDB();

/**
 * Order 87 — Cross-campaign learning from simulated `BrokerAdSimulationPerformance` + campaigns
 * (maps to legacy “broker campaign” / performance tables; no live ad APIs).
 */
export type WinningCampaignPattern = {
  id: string;
  platform: AdPlatform;
  audience: "buyer" | "seller" | "host" | "broker";
  city?: string;
  pattern: string;
  evidence: {
    campaigns: number;
    avgCtr: number;
    avgConversionRate: number;
    avgCostPerConversionCents: number | null;
  };
};

export type CampaignLearningSummary = {
  totalCampaignsAnalyzed: number;
  winningPatterns: WinningCampaignPattern[];
  weakPatterns: WinningCampaignPattern[];
  /** Human-readable e.g. “TikTok host campaigns perform best with question-based hooks.” */
  recommendation: string;
  /** Best platform/audience by first winning group (for investor / summary UI). */
  bestPlatform: AdPlatform | null;
  bestAudience: (typeof AUDIENCE_CANON)[number] | null;
  winningPatternCount: number;
};

const AUDIENCE_CANON = ["buyer", "seller", "host", "broker"] as const;

function canonAudience(a: string): (typeof AUDIENCE_CANON)[number] {
  const x = a.trim().toLowerCase();
  if (x === "buyer" || x === "seller" || x === "host" || x === "broker") return x;
  return "buyer";
}

function canonPlatform(p: string): AdPlatform {
  try {
    return parseAdPlatform(p);
  } catch {
    return "meta";
  }
}

type GroupRow = {
  key: string;
  platform: AdPlatform;
  audience: (typeof AUDIENCE_CANON)[number];
  city?: string;
  patternCounts: Map<string, number>;
  totalCtr: number;
  totalCvr: number;
  totalCpcCents: number;
  cpcCount: number;
  n: number;
};

function emptyGroup(k: string, platform: AdPlatform, audience: (typeof AUDIENCE_CANON)[number], city: string | undefined): GroupRow {
  return {
    key: k,
    platform,
    audience,
    city,
    patternCounts: new Map(),
    totalCtr: 0,
    totalCvr: 0,
    totalCpcCents: 0,
    cpcCount: 0,
    n: 0,
  };
}

function modePattern(m: Map<string, number>): string {
  let best = "general marketplace copy";
  let c = 0;
  for (const [p, n] of m) {
    if (n > c) {
      c = n;
      best = p;
    }
  }
  return best;
}

function groupKey(platform: string, audience: string, city: string | null | undefined): string {
  const c = (city?.trim() ?? "") || "";
  return `${platform}||${audience}||${c}`;
}

function rowToPattern(
  g: GroupRow,
  idPrefix: "win" | "weak"
): WinningCampaignPattern {
  const pat = modePattern(g.patternCounts);
  const avgCtr = g.n > 0 ? g.totalCtr / g.n : 0;
  const avgCvr = g.n > 0 ? g.totalCvr / g.n : 0;
  const avgCpcCents = g.cpcCount > 0 ? g.totalCpcCents / g.cpcCount : null;
  return {
    id: `${idPrefix}:${g.key}`,
    platform: g.platform,
    audience: g.audience,
    city: g.city,
    pattern: pat,
    evidence: {
      campaigns: g.n,
      avgCtr,
      avgConversionRate: avgCvr,
      avgCostPerConversionCents: avgCpcCents,
    },
  };
}

/**
 * Analyzes completed simulations with at least one performance row.
 */
export async function getCampaignLearningSummary(userId?: string): Promise<CampaignLearningSummary> {
  const rows = await prisma.brokerAdSimulationCampaign.findMany({
    where: userId ? { userId } : undefined,
    include: { performanceRows: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const withPerf = rows.filter((r) => r.performanceRows[0] != null);
  const totalCampaignsAnalyzed = withPerf.length;
  if (totalCampaignsAnalyzed === 0) {
    return {
      totalCampaignsAnalyzed: 0,
      winningPatterns: [],
      weakPatterns: [],
      recommendation:
        "No campaigns with performance data yet. Run simulations to start cross-campaign learning.",
      bestPlatform: null,
      bestAudience: null,
      winningPatternCount: 0,
    };
  }

  const groups = new Map<string, GroupRow>();
  for (const r of withPerf) {
    const perf = r.performanceRows[0]!;
    const p = canonPlatform(r.platform);
    const a = canonAudience(r.audience);
    const c = r.city?.trim() || undefined;
    const k = groupKey(p, a, c ?? null);
    const pat = extractPatternFromCopy(r.headline, r.body, p);
    const m = derivePerformanceMetrics(perf);
    const cpcCents =
      m.costPerConversion != null && Number.isFinite(m.costPerConversion)
        ? Math.round(m.costPerConversion * 100)
        : null;

    let g = groups.get(k);
    if (!g) {
      g = emptyGroup(k, p, a, c);
      groups.set(k, g);
    }
    g.patternCounts.set(pat, (g.patternCounts.get(pat) ?? 0) + 1);
    g.n += 1;
    g.totalCtr += m.ctr;
    g.totalCvr += m.conversionRate;
    if (cpcCents != null) {
      g.totalCpcCents += cpcCents;
      g.cpcCount += 1;
    }
  }

  const winning: WinningCampaignPattern[] = [];
  const weak: WinningCampaignPattern[] = [];
  for (const g of groups.values()) {
    const avgCtr = g.n > 0 ? g.totalCtr / g.n : 0;
    const avgCvr = g.n > 0 ? g.totalCvr / g.n : 0;
    const kind = order87ClassifyGroup(g.n, avgCtr, avgCvr);
    if (kind === "win") {
      winning.push(rowToPattern(g, "win"));
    } else if (kind === "weak") {
      weak.push(rowToPattern(g, "weak"));
    }
  }

  winning.sort((a, b) => b.evidence.avgCtr - a.evidence.avgCtr);
  weak.sort((a, b) => a.evidence.avgCtr - b.evidence.avgCtr);

  const first = winning[0];
  const bestPlatform = first ? first.platform : null;
  const bestAudience = first ? first.audience : null;
  const recommendation = buildRecommendationText(winning, weak, totalCampaignsAnalyzed);

  return {
    totalCampaignsAnalyzed,
    winningPatterns: winning,
    weakPatterns: weak,
    recommendation,
    bestPlatform,
    bestAudience,
    winningPatternCount: winning.length,
  };
}

function buildRecommendationText(
  winning: WinningCampaignPattern[],
  weak: WinningCampaignPattern[],
  total: number
): string {
  if (winning.length === 0) {
    return `Analyzed ${total} campaign(s) with performance; need 3+ per platform/audience/city with strong CTR and conversion to surface winning patterns.`;
  }
  const w = winning[0]!;
  return `${w.platform} ${w.audience} campaigns in ${w.city ? `${w.city} ` : "your markets "}look strongest with ${w.pattern} (avg CTR ${(w.evidence.avgCtr * 100).toFixed(1)}%, CVR ${(w.evidence.avgConversionRate * 100).toFixed(1)}%).`;
}

export async function getWinningCampaignPatterns(userId?: string): Promise<WinningCampaignPattern[]> {
  const s = await getCampaignLearningSummary(userId);
  return s.winningPatterns;
}

export type ApplyCampaignLearningInput = {
  copy: ReturnType<typeof generateAdCopy>;
  platform: AdPlatform;
  userId?: string;
};

export type LearnedVariant = {
  platform: AdPlatform;
  headline: string;
  body: string;
  reason: string;
};

/**
 * Suggests a non-destructive pattern variant; does not change `copy` base fields.
 * Emits analytics when a variant is produced. Order 88 feedback stays on `copy.learnedVariant`.
 */
export async function applyCampaignLearningToCopy(
  input: ApplyCampaignLearningInput
): Promise<ReturnType<typeof generateAdCopy> & { patternLearnedVariant?: LearnedVariant }> {
  const { copy, platform, userId } = input;
  const patterns = await getWinningCampaignPatterns(userId);
  const a = copy.audience;
  const city = copy.city?.trim();

  const match =
    patterns.find(
      (p) => p.platform === platform && p.audience === a && (city == null || p.city == null || p.city === city)
    ) ?? patterns.find((p) => p.platform === platform && p.audience === a);

  if (!match) {
    return { ...copy, patternLearnedVariant: undefined };
  }

  const patternLearnedVariant = buildVariantForPattern(copy, platform, match.pattern);
  void writeMarketplaceEvent("learned_copy_variant_generated", {
    platform: match.platform,
    audience: match.audience,
    pattern: match.pattern,
  }).catch(() => {});

  return { ...copy, patternLearnedVariant };
}

function buildVariantForPattern(
  copy: ReturnType<typeof generateAdCopy>,
  platform: AdPlatform,
  pattern: string
): LearnedVariant {
  const baseH = copy.originalCopy?.headline ?? copy.headline;
  const baseB = copy.originalCopy?.body ?? copy.body;
  let headline = baseH;
  let body = baseB;
  if (pattern === "urgency-driven headline") {
    headline = `Today: ${baseH}`;
  } else if (pattern === "question-based hook") {
    if (!headline.trim().endsWith("?")) {
      headline = `${headline.split(".")[0]?.trim() ?? headline}?`;
    }
  } else if (pattern === "trust-focused copy") {
    body = `${baseB} Your data and bookings stay on trusted, secure rails.`;
  } else if (pattern === "value-focused copy") {
    body = `${baseB} See how similar hosts and sellers capture more value.`;
  } else {
    headline = `${baseH} (refined)`;
  }
  return {
    platform,
    headline: headline.slice(0, 180),
    body: body.slice(0, 500),
    reason: "Based on prior high-performing campaigns",
  };
}

/**
 * Async helper: {@link generateAdCopy} (with optional Order 88 feedback) + optional `patternLearnedVariant` when a winning pattern exists.
 */
export async function generateAdCopyWithLearning(input: {
  audience: AdAudience;
  city?: string;
  platform: AdPlatform;
  userId?: string;
  /** When set, avoids a second DB call to {@link getCampaignFeedbackInsights}. */
  feedbackInsights?: CampaignFeedbackInsights | null;
}): Promise<ReturnType<typeof generateAdCopy> & { patternLearnedVariant?: LearnedVariant }> {
  const feedbackInsights =
    input.feedbackInsights !== undefined
      ? input.feedbackInsights
      : input.userId
        ? await getCampaignFeedbackInsights(input.userId)
        : null;
  const copy = generateAdCopy({
    audience: input.audience,
    city: input.city,
    feedbackInsights: feedbackInsights ?? undefined,
  });
  return applyCampaignLearningToCopy({
    copy,
    platform: input.platform,
    userId: input.userId,
  });
}
