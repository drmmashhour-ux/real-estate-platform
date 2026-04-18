import { prisma } from "@/lib/db";
import type { MarketingCampaign } from "@prisma/client";
import { buildTrackedLandingUrl } from "@/modules/ads/utm-builder";
import { GrowthEventName } from "@/modules/growth/event-types";
import { startOfUtcDay } from "@/modules/analytics/services/get-platform-stats";

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export type CreateCampaignInput = {
  name: string;
  slug?: string;
  landingPath?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  notes?: string | null;
};

export async function createCampaign(input: CreateCampaignInput): Promise<MarketingCampaign> {
  const slug = input.slug?.trim() || slugify(input.name);
  if (!slug) throw new Error("Invalid campaign slug");
  return prisma.marketingCampaign.create({
    data: {
      name: input.name.trim().slice(0, 160),
      slug,
      landingPath: input.landingPath?.trim().slice(0, 512) ?? null,
      utmSource: input.utmSource?.trim().slice(0, 128) ?? null,
      utmMedium: input.utmMedium?.trim().slice(0, 64) ?? null,
      utmCampaign: input.utmCampaign?.trim().slice(0, 256) ?? null,
      utmTerm: input.utmTerm?.trim().slice(0, 256) ?? null,
      utmContent: input.utmContent?.trim().slice(0, 256) ?? null,
      notes: input.notes?.trim().slice(0, 4000) ?? null,
    },
  });
}

export async function listCampaigns(opts?: { activeOnly?: boolean }): Promise<MarketingCampaign[]> {
  return prisma.marketingCampaign.findMany({
    where: opts?.activeOnly ? { isActive: true } : undefined,
    orderBy: { updatedAt: "desc" },
  });
}

/** Full tracking URL for a saved campaign (default Québec locale prefix). */
export function buildCampaignTrackedUrl(
  campaign: MarketingCampaign,
  localeCountryPrefix = "/fr/ca"
): string {
  const src = campaign.utmSource?.trim();
  const med = campaign.utmMedium?.trim();
  const cmp = campaign.utmCampaign?.trim();
  if (!src || !med || !cmp) {
    throw new Error("Campaign must have utmSource, utmMedium, and utmCampaign to build a tracking URL");
  }
  return buildTrackedLandingUrl({
    localeCountryPrefix,
    landingPath: campaign.landingPath?.trim() || "/",
    utm: {
      utm_source: src,
      utm_medium: med,
      utm_campaign: cmp,
      utm_term: campaign.utmTerm,
      utm_content: campaign.utmContent,
    },
  });
}

/** Aggregates `growth_events` rows that match the campaign’s `utm_campaign` (deterministic DB). */
export async function getCampaignGrowthStats(
  campaign: MarketingCampaign,
  days = 30
): Promise<{
  utmCampaign: string | null;
  range: { start: string; end: string; days: number };
  counts: {
    pageViews: number;
    signups: number;
    logins: number;
    bookingsStarted: number;
    bookingsCompleted: number;
    brokerLeads: number;
  };
} | null> {
  const cmp = campaign.utmCampaign?.trim();
  if (!cmp) return null;
  const d = Math.max(1, Math.min(180, days));
  const end = addDays(startOfUtcDay(new Date()), 1);
  const start = addDays(end, -d);
  const whereDate = { gte: start, lt: end };
  const whereCamp = { utmCampaign: cmp, createdAt: whereDate };

  const [pageViews, signups, logins, bookingsStarted, bookingsCompleted, brokerLeads] = await Promise.all([
    prisma.growthEvent.count({ where: { ...whereCamp, eventName: GrowthEventName.PAGE_VIEW } }),
    prisma.growthEvent.count({ where: { ...whereCamp, eventName: GrowthEventName.SIGNUP_SUCCESS } }),
    prisma.growthEvent.count({ where: { ...whereCamp, eventName: GrowthEventName.LOGIN } }),
    prisma.growthEvent.count({ where: { ...whereCamp, eventName: GrowthEventName.BOOKING_STARTED } }),
    prisma.growthEvent.count({ where: { ...whereCamp, eventName: GrowthEventName.BOOKING_COMPLETED } }),
    prisma.growthEvent.count({ where: { ...whereCamp, eventName: GrowthEventName.BROKER_LEAD } }),
  ]);

  return {
    utmCampaign: cmp,
    range: { start: start.toISOString(), end: end.toISOString(), days: d },
    counts: {
      pageViews,
      signups,
      logins,
      bookingsStarted,
      bookingsCompleted,
      brokerLeads,
    },
  };
}
