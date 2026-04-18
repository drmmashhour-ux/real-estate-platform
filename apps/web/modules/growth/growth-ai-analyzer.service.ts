/**
 * Paid funnel (UTM) awareness for growth AI — reads FormSubmission early_conversion_lead only.
 * Additive, non-destructive; thresholds are conservative heuristics.
 */

import { prisma } from "@/lib/db";

const EARLY_FORM = "early_conversion_lead";

/** Campaign with fewer leads than this may be flagged when overall volume exists. */
const CAMPAIGN_UNDERPERFORM_THRESHOLD = 3;

/** Share of attributed leads above which a campaign is considered dominant. */
const DOMINANT_CAMPAIGN_SHARE = 0.5;

export type EarlyConversionAdsSnapshot = {
  /** Label → count (label "(no UTM)" when missing). */
  campaignCounts: { label: string; count: number }[];
  totalLeads: number;
  /** Leads with non-empty utm_campaign in metadata. */
  leadsWithUtmCampaign: number;
  leadsToday: number;
  topCampaign: { label: string; count: number } | null;
};

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function getMetadata(payloadJson: unknown): Record<string, unknown> | null {
  if (!payloadJson || typeof payloadJson !== "object") return null;
  const m = (payloadJson as Record<string, unknown>).metadata;
  if (!m || typeof m !== "object") return null;
  return m as Record<string, unknown>;
}

function campaignLabelFromPayload(payloadJson: unknown): string {
  const m = getMetadata(payloadJson);
  const c = m?.utm_campaign;
  if (typeof c === "string" && c.trim()) return c.trim();
  return "(no UTM)";
}

export async function fetchEarlyConversionAdsSnapshot(): Promise<EarlyConversionAdsSnapshot> {
  const [rows, startDay] = await Promise.all([
    prisma.formSubmission.findMany({
      where: { formType: EARLY_FORM, status: "submitted" },
      select: { payloadJson: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10_000,
    }),
    Promise.resolve(startOfUtcDay(new Date())),
  ]);

  const map = new Map<string, number>();
  let leadsToday = 0;
  for (const r of rows) {
    const label = campaignLabelFromPayload(r.payloadJson);
    map.set(label, (map.get(label) ?? 0) + 1);
    if (r.createdAt >= startDay) leadsToday += 1;
  }

  const campaignCounts = [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const totalLeads = rows.length;
  let leadsWithUtmCampaign = 0;
  for (const r of rows) {
    const m = getMetadata(r.payloadJson);
    const c = m?.utm_campaign;
    if (typeof c === "string" && c.trim()) leadsWithUtmCampaign += 1;
  }

  const attributed = campaignCounts.filter((c) => c.label !== "(no UTM)");
  /** campaignCounts is sorted by count desc — first attributed row is top UTM campaign. */
  const topCampaign = attributed.length > 0 ? attributed[0]! : null;

  return {
    campaignCounts,
    totalLeads,
    leadsWithUtmCampaign,
    leadsToday,
    topCampaign,
  };
}

/** UTC calendar day prior to today (00:00Z–24:00Z) for early_conversion_lead submissions. */
export type EarlyConversionYesterdayStats = {
  /** YYYY-MM-DD (UTC) for the yesterday window. */
  utcDate: string;
  leads: number;
  /** Distinct non-empty utm_campaign values with at least one lead yesterday. */
  campaignsActive: number;
  /** Highest-volume campaign label yesterday (prefers attributed UTM when tied). */
  topCampaign?: string;
  /** Present when payload metadata explicitly flags conversion start signals. */
  conversionsStarted?: number;
};

/**
 * Read-only counts for yesterday (UTC) — same form type + UTM labeling as {@link fetchEarlyConversionAdsSnapshot}.
 */
export async function fetchEarlyConversionYesterdayStats(): Promise<EarlyConversionYesterdayStats> {
  const todayStart = startOfUtcDay(new Date());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

  const rows = await prisma.formSubmission.findMany({
    where: {
      formType: EARLY_FORM,
      status: "submitted",
      createdAt: { gte: yesterdayStart, lt: todayStart },
    },
    select: { payloadJson: true },
    take: 10_000,
  });

  const map = new Map<string, number>();
  let conversionsStarted = 0;
  for (const r of rows) {
    const label = campaignLabelFromPayload(r.payloadJson);
    map.set(label, (map.get(label) ?? 0) + 1);
    const m = getMetadata(r.payloadJson);
    if (m?.conversion_started === true || m?.conversion_flow_started === true) {
      conversionsStarted += 1;
    }
  }

  const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const attributed = entries.filter(([label]) => label !== "(no UTM)");
  const campaignsActive = attributed.length;
  const topAttributed = attributed[0];
  const topOverall = entries[0];
  const topCampaign =
    topAttributed?.[0] ?? (topOverall && topOverall[0] !== "(no UTM)" ? topOverall[0] : undefined);

  return {
    utcDate: yesterdayStart.toISOString().slice(0, 10),
    leads: rows.length,
    campaignsActive,
    topCampaign,
    conversionsStarted: conversionsStarted > 0 ? conversionsStarted : undefined,
  };
}

export type AdsPerformanceHealth = "STRONG" | "OK" | "WEAK";

export function computeAdsPerformanceHealth(leadsToday: number): AdsPerformanceHealth {
  if (leadsToday > 5) return "STRONG";
  if (leadsToday >= 1) return "OK";
  return "WEAK";
}

export function computePaidFunnelAdsInsights(snap: EarlyConversionAdsSnapshot): {
  problems: string[];
  opportunities: string[];
  health: AdsPerformanceHealth;
} {
  const health = computeAdsPerformanceHealth(snap.leadsToday);
  const problems: string[] = [];
  const opportunities: string[] = [];

  if (snap.totalLeads >= 5 && snap.leadsWithUtmCampaign > 0) {
    for (const row of snap.campaignCounts) {
      if (row.label === "(no UTM)") continue;
      if (row.count < CAMPAIGN_UNDERPERFORM_THRESHOLD) {
        problems.push(`campaign underperforming (${row.label})`);
      }
    }
  }

  if (snap.topCampaign && snap.leadsWithUtmCampaign >= 4) {
    const share = snap.topCampaign.count / snap.leadsWithUtmCampaign;
    if (share >= DOMINANT_CAMPAIGN_SHARE) {
      opportunities.push(`scale winning campaign (${snap.topCampaign.label})`);
    }
  }

  return { problems, opportunities, health };
}
