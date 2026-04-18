/**
 * Acquisition at scale — channels + referrals; CAC needs spend ingestion (optional env).
 */

import { prisma } from "@/lib/db";
import { getAcquisitionChannelRoi } from "./acquisition-channel-roi.service";

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

export type AcquisitionScaleSnapshot = {
  channels: Awaited<ReturnType<typeof getAcquisitionChannelRoi>>;
  referralEvents30d: number;
  estimatedMonthlyAdSpendCad: number | null;
  blendedCacCad: number | null;
  note: string;
};

function parseEstimatedSpend(): number | null {
  const raw = process.env.PLATFORM_EST_MONTHLY_AD_SPEND_CAD?.trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function getAcquisitionScaleSnapshot(): Promise<AcquisitionScaleSnapshot> {
  const channelRoi = await getAcquisitionChannelRoi();
  const to = addUtcDays(startOfUtcDay(new Date()), 1);
  const from = addUtcDays(to, -30);

  const referralEvents30d = await prisma.referralEvent
    .count({
      where: { createdAt: { gte: from, lt: to } },
    })
    .catch(() => 0);

  const totalLeads30d = channelRoi.channels.reduce((s, c) => s + c.leads30d, 0);
  const estimatedMonthlyAdSpendCad = parseEstimatedSpend();

  let blendedCacCad: number | null = null;
  if (estimatedMonthlyAdSpendCad != null && totalLeads30d > 0) {
    blendedCacCad = Math.round((estimatedMonthlyAdSpendCad / totalLeads30d) * 100) / 100;
  }

  return {
    channels: channelRoi,
    referralEvents30d,
    estimatedMonthlyAdSpendCad,
    blendedCacCad,
    note:
      blendedCacCad == null
        ? "Set PLATFORM_EST_MONTHLY_AD_SPEND_CAD for blended CAC. Referral events counted from ReferralEvent (30d)."
        : "Blended CAC = estimated ad spend / CRM leads (30d). Refine per channel when spend is wired.",
  };
}
