import "server-only";

import { getBrokerIntelligence } from "@/lib/broker/intelligence";
import { writeMarketplaceEvent } from "@/lib/analytics/tracker";
import {
  createCampaign,
  scheduleCampaign,
  type CreateBrokerCampaignInput,
  derivePerformanceMetrics,
  computeBrokerSimulationSample,
  runCampaignSimulation,
} from "@/lib/marketing/campaignEngine";
import type { AdPlatform } from "@/lib/marketing/campaignEnginePure";
import { generateAdCopy } from "@/lib/marketing/adCopyEngine";
import { getCampaignFeedbackInsights } from "@/lib/marketing/campaignFeedback";
import { getWinningCampaignPatterns } from "@/lib/marketing/campaignLearning";
import type { AdAudience } from "@/lib/marketing/adCopyEngine";

const PLATFORMS: AdPlatform[] = ["tiktok", "meta", "google"];
const MAX_INSIGHTS = 4;
const MIN_CTR = 0.02;
const MIN_CVR = 0.03;
const MAX_TOP_PER_GROUP = 2;

export type AutonomousLauncherResult = {
  dryRun: boolean;
  generated: number;
  simulated: number;
  selected: number;
  /** Post-selection "scheduling" intent: 0 in dry run; when not dry, equals `selected` (no extra DB `schedule` after `completed` — see JSDoc on {@link runAutonomousCampaignLauncher}). */
  scheduled: number;
  campaigns: Array<{
    id: string;
    platform: string;
    score: number;
    recommendation: string;
  }>;
};

type InsightSource = { key: string; audience: AdAudience; city?: string; label: string };

type ScoredRow = {
  id: string;
  insightKey: string;
  platform: AdPlatform;
  score: number;
  metrics: ReturnType<typeof derivePerformanceMetrics>;
  recommendation: string;
};

/**
 * Heuristic 0–10 score (Order 89) from simulated derived metrics. `costPerConversion` in dollars.
 */
export function scoreCampaign(metrics: {
  ctr: number;
  conversionRate: number;
  costPerConversion: number | null;
}): number {
  const cpc = metrics.costPerConversion ?? 0;
  const raw = metrics.ctr * 3 + metrics.conversionRate * 4 - cpc / 100;
  return Math.max(0, Math.min(10, 2.5 + raw * 12));
}

function safeText(s: string, max: number) {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

function copyForPlatformAndVariant(
  copy: ReturnType<typeof generateAdCopy>,
  platform: AdPlatform,
  variant: "original" | "learned" | "urgent"
): { headline: string; body: string } {
  if (variant === "learned" && copy.learnedVariant && copy.learnedVariant.platform === platform) {
    return {
      headline: safeText(copy.learnedVariant.headline, 200),
      body: safeText(copy.learnedVariant.body, 2000),
    };
  }
  if (platform === "tiktok") {
    return {
      headline: safeText(copy.channels.tiktok.hook, 200),
      body: safeText(copy.channels.tiktok.caption, 2000),
    };
  }
  if (platform === "meta") {
    return {
      headline: safeText(copy.channels.meta.headline, 200),
      body: safeText(copy.channels.meta.body, 2000),
    };
  }
  return {
    headline: safeText(copy.channels.google.headlines[0] ?? copy.headline, 90),
    body: safeText(`${copy.channels.google.description} ${copy.channels.google.headlines[1] ?? ""}`, 2000),
  };
}

function withUrgency(h: string, b: string): { headline: string; body: string } {
  return { headline: safeText(`Limited time — ${h}`, 200), body: b };
}

async function loadInsightSources(userId: string): Promise<InsightSource[]> {
  const out: InsightSource[] = [];
  const seen = new Set<string>();
  try {
    const bi = await getBrokerIntelligence(userId);
    for (const row of bi) {
      if (out.length >= MAX_INSIGHTS) {
        break;
      }
      const k = `${row.audience}|${row.city ?? ""}`;
      if (seen.has(k)) {
        continue;
      }
      seen.add(k);
      out.push({
        key: `listing:${row.listingId.slice(0, 8)}`,
        audience: row.audience,
        city: row.city,
        label: row.title?.slice(0, 64) ?? row.type,
      });
    }
  } catch {
    // intelligence SQL may be unavailable in some envs; continue with patterns only
  }
  return out;
}

/**
 * **Simulation-only** pipeline: no live ad APIs, no real spend. When `dryRun` is `true` (default),
 * does **not** call `createCampaign` / `runCampaignSimulation` — it scores in memory only.
 * When `dryRun` is `false`, creates drafts, schedules for immediate sim, then completes (simulation).
 * Post-sim, selected rows cannot transition back to `scheduled` in the current state machine, so
 * "scheduling" is implemented as `writeMarketplaceEvent` + the `scheduled` count in the return value.
 */
export async function runAutonomousCampaignLauncher(args: { userId: string; dryRun?: boolean }): Promise<AutonomousLauncherResult> {
  const { userId, dryRun = true } = args;
  const [intelIns, feedback, patterns] = await Promise.all([
    loadInsightSources(userId),
    getCampaignFeedbackInsights(userId).catch((): Awaited<ReturnType<typeof getCampaignFeedbackInsights>> | null => null),
    getWinningCampaignPatterns(userId).catch((): Awaited<ReturnType<typeof getWinningCampaignPatterns>> | null => null),
  ]);

  const f = feedback;

  for (const p of patterns?.slice(0, 2) ?? []) {
    if (intelIns.length >= MAX_INSIGHTS) {
      break;
    }
    intelIns.push({
      key: `pattern:${p.id}`,
      audience: p.audience,
      city: p.city,
      label: p.pattern,
    });
  }

  if (f?.eligible && f.bestAudience && intelIns.length === 0) {
    intelIns.push({
      key: "feedback:default",
      audience: f.bestAudience,
      city: f.bestCity ?? undefined,
      label: "Feedback-driven",
    });
  }

  if (intelIns.length === 0) {
    return {
      dryRun,
      generated: 0,
      simulated: 0,
      selected: 0,
      scheduled: 0,
      campaigns: [],
    };
  }

  const variants: ("original" | "learned" | "urgent")[] = ["original", "learned", "urgent"];
  const toCreate: Array<{
    insight: InsightSource;
    platform: AdPlatform;
    variant: (typeof variants)[number];
    headline: string;
    body: string;
  }> = [];

  for (const ins of intelIns) {
    const copy = generateAdCopy({
      audience: ins.audience,
      city: ins.city,
      feedbackInsights: f ?? undefined,
    });
    PLATFORMS.forEach((platform, i) => {
      const v = variants[i]!;
      if (v === "learned" && !copy.learnedVariant) {
        return;
      }
      let c = copyForPlatformAndVariant(copy, platform, v);
      if (v === "urgent") {
        c = withUrgency(c.headline, c.body);
      }
      toCreate.push({ insight: ins, platform, variant: v, headline: c.headline, body: c.body });
    });
  }

  const scored: ScoredRow[] = [];
  let generated = 0;
  let simulated = 0;

  if (dryRun) {
    for (const row of toCreate) {
      generated += 1;
      const sample = computeBrokerSimulationSample(row.platform, row.insight.audience);
      const m = derivePerformanceMetrics({
        ...sample,
        spend: sample.spend,
      });
      simulated += 1;
      const id = `dry-${row.insight.key}-${row.platform}-${row.variant}`;
      scored.push({
        id,
        insightKey: row.insight.key,
        platform: row.platform,
        score: scoreCampaign(m),
        metrics: m,
        recommendation: `Simulated: CTR ${(m.ctr * 100).toFixed(1)}%, CVR ${(m.conversionRate * 100).toFixed(1)}%`,
      });
    }
  } else {
    for (const row of toCreate) {
      const input: CreateBrokerCampaignInput = {
        userId,
        audience: row.insight.audience,
        city: row.insight.city ?? null,
        platform: row.platform,
        headline: row.headline,
        body: row.body,
        createdBy: "ai",
      };
      const created = await createCampaign(input);
      generated += 1;
      const at = new Date();
      await scheduleCampaign(created.id, userId, at);
      const run = await runCampaignSimulation(created.id, userId);
      simulated += 1;
      const m = derivePerformanceMetrics(run.performance);
      const id = created.id;
      scored.push({
        id,
        insightKey: row.insight.key,
        platform: row.platform,
        score: scoreCampaign(m),
        metrics: m,
        recommendation: `Simulated: CTR ${(m.ctr * 100).toFixed(1)}%, CVR ${(m.conversionRate * 100).toFixed(1)}%`,
      });
    }
  }

  const passing = scored.filter((s) => s.metrics.ctr >= MIN_CTR && s.metrics.conversionRate >= MIN_CVR);
  const byKey = new Map<string, ScoredRow[]>();
  for (const s of passing) {
    const list = byKey.get(s.insightKey) ?? [];
    list.push(s);
    byKey.set(s.insightKey, list);
  }
  const selectedRows: ScoredRow[] = [];
  for (const list of byKey.values()) {
    list.sort((a, b) => b.score - a.score);
    selectedRows.push(...list.slice(0, MAX_TOP_PER_GROUP));
  }
  selectedRows.sort((a, b) => b.score - a.score);

  for (const s of selectedRows) {
    void writeMarketplaceEvent("auto_campaign_selected", {
      campaignId: s.id,
      score: s.score,
    }).catch(() => {});
  }

  const scheduled = dryRun ? 0 : selectedRows.length;
  for (const s of selectedRows) {
    if (dryRun) {
      void writeMarketplaceEvent("auto_campaign_recommended", {
        campaignId: s.id,
        dryRun: true,
        score: s.score,
      }).catch(() => {});
    } else {
      void writeMarketplaceEvent("auto_campaign_scheduled_intent", {
        campaignId: s.id,
        note: "Simulation complete; no external ad publish. Manual approval for real execution.",
      }).catch(() => {});
    }
  }

  void writeMarketplaceEvent("auto_campaign_run", {
    generated,
    simulated,
    selected: selectedRows.length,
    dryRun,
  }).catch(() => {});

  return {
    dryRun,
    generated,
    simulated,
    selected: selectedRows.length,
    scheduled: dryRun ? 0 : selectedRows.length,
    campaigns: selectedRows.map((s) => ({
      id: s.id,
      platform: s.platform,
      score: Math.round(s.score * 100) / 100,
      recommendation: s.recommendation,
    })),
  };
}
