/**
 * Channel attribution from CRM leads — CAC requires external ad spend (not in DB); ROI is leads-only proxy.
 */

import { prisma } from "@/lib/db";

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export type ChannelBucket = "tiktok" | "paid_ads" | "organic" | "other";

export type ChannelRoiRow = {
  channel: ChannelBucket;
  leads30d: number;
  /** Placeholder until marketing spend is ingested — null means unknown CAC */
  estimatedCacCad: number | null;
  note: string;
};

function bucketLead(source: string | null, medium: string | null, campaign: string | null): ChannelBucket {
  const blob = `${source ?? ""} ${medium ?? ""} ${campaign ?? ""}`.toLowerCase();
  if (blob.includes("tiktok") || blob.includes("tt_")) return "tiktok";
  if (
    /\b(cpc|cpm|ppc|paid|ads?|facebook|meta|google|sem)\b/.test(blob) ||
    medium === "cpc" ||
    medium === "paid"
  ) {
    return "paid_ads";
  }
  if (!source || source === "direct" || medium === "organic" || blob.includes("organic")) return "organic";
  return "other";
}

export async function getAcquisitionChannelRoi(): Promise<{
  channels: ChannelRoiRow[];
  disclaimer: string;
}> {
  const to = addUtcDays(startOfUtcDay(new Date()), 1);
  const from = addUtcDays(to, -30);

  const rows = await prisma.lead.findMany({
    where: { createdAt: { gte: from, lt: to } },
    select: { source: true, medium: true, campaign: true },
    take: 25_000,
  });

  const counts: Record<ChannelBucket, number> = {
    tiktok: 0,
    paid_ads: 0,
    organic: 0,
    other: 0,
  };

  for (const r of rows) {
    const b = bucketLead(r.source, r.medium, r.campaign);
    counts[b] += 1;
  }

  const disclaimer =
    "CAC/ROI are informational: connect ad account spend to compute true CAC — currently leads-per-channel only.";

  const channels: ChannelRoiRow[] = (Object.keys(counts) as ChannelBucket[]).map((channel) => ({
    channel,
    leads30d: counts[channel],
    estimatedCacCad: null,
    note: "Ingest platform spend (Meta/Google/TikTok) to estimate CAC per channel.",
  }));

  return { channels, disclaimer };
}
