/**
 * SQL-backed conservative LOW_CONVERSION / INSUFFICIENT_DATA signals for CRO surfaces and retargeting messages.
 */
import { prisma } from "@/lib/db";
import { croRetargetingLearningFlags, negativeSignalQualityFlags } from "@/config/feature-flags";
import {
  getRetargetingPerformanceBySegment,
  getWeakRetargetingMessages,
} from "./cro-retargeting-learning.repository";

export type LowConversionRow = {
  entityId: string;
  entityKind: "CRO_SURFACE" | "RETARGETING_MESSAGE";
  signalType: "LOW_CONVERSION" | "INSUFFICIENT_DATA";
  impressions: number;
  clicks: number;
  leads: number;
  bookings: number;
  conversionRate: number | null;
  evidenceScore: number;
  evidenceQuality: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
  warnings: string[];
};

const MIN_CTA_FOR_RATE = 40;
const MIN_RT_CLICKS = 15;

function safeRate(num: number, den: number): number | null {
  if (den <= 0) return null;
  return num / den;
}

export async function detectLowConversionSurfaces(rangeDays = 14): Promise<LowConversionRow[]> {
  if (!croRetargetingLearningFlags.croSqlLowConversionV1 && !negativeSignalQualityFlags.negativeSignalQualityV1) {
    return [];
  }

  const since = new Date(Date.now() - rangeDays * 864e5);
  const [ctaClicks, leadCaptures, bookingStarted, bookingCompleted] = await Promise.all([
    prisma.growthEvent.count({ where: { eventName: "cta_click", createdAt: { gte: since } } }),
    prisma.growthEvent.count({ where: { eventName: "lead_capture", createdAt: { gte: since } } }),
    prisma.growthEvent.count({ where: { eventName: "booking_started", createdAt: { gte: since } } }),
    prisma.growthEvent.count({ where: { eventName: "booking_completed", createdAt: { gte: since } } }),
  ]);

  const out: LowConversionRow[] = [];
  const leadRate = safeRate(leadCaptures, ctaClicks);
  const checkoutRate = safeRate(bookingStarted, Math.max(1, leadCaptures));
  const payRate = safeRate(bookingCompleted, Math.max(1, bookingStarted));

  if (ctaClicks < MIN_CTA_FOR_RATE) {
    out.push({
      entityId: "funnel:cta_to_lead",
      entityKind: "CRO_SURFACE",
      signalType: "INSUFFICIENT_DATA",
      impressions: 0,
      clicks: ctaClicks,
      leads: leadCaptures,
      bookings: bookingCompleted,
      conversionRate: leadRate,
      evidenceScore: 0.2,
      evidenceQuality: "LOW",
      reasons: ["Not enough cta_click volume to claim LOW_CONVERSION."],
      warnings: [`cta_click=${ctaClicks} (< ${MIN_CTA_FOR_RATE})`],
    });
    return out;
  }

  const reasons: string[] = [];
  const warnings: string[] = [];
  let weak = false;
  if (leadRate != null && leadRate < 0.03 && leadCaptures < ctaClicks * 0.05) {
    weak = true;
    reasons.push("High CTA engagement with weak lead capture rate in window.");
  }

  if (bookingStarted >= 8 && payRate != null && payRate < 0.25) {
    weak = true;
    reasons.push("Checkout starts exist but completion rate is depressed.");
  }

  const evidenceScore = weak ? 0.48 + Math.min(0.2, ctaClicks / 2000) : 0.25;
  const evidenceQuality: LowConversionRow["evidenceQuality"] =
    ctaClicks >= 200 ? "MEDIUM" : ctaClicks >= 80 ? "MEDIUM" : "LOW";

  if (!weak) {
    out.push({
      entityId: "funnel:aggregate",
      entityKind: "CRO_SURFACE",
      signalType: "INSUFFICIENT_DATA",
      impressions: 0,
      clicks: ctaClicks,
      leads: leadCaptures,
      bookings: bookingCompleted,
      conversionRate: leadRate,
      evidenceScore,
      evidenceQuality,
      reasons: ["Heuristics did not meet conservative LOW_CONVERSION bar."],
      warnings: [
        `leadRate=${leadRate != null ? (leadRate * 100).toFixed(2) : "—"}%`,
        `checkout→paid=${payRate != null ? (payRate * 100).toFixed(1) : "—"}%`,
      ],
    });
    return out;
  }

  out.push({
    entityId: "funnel:cta_lead_checkout",
    entityKind: "CRO_SURFACE",
    signalType: "LOW_CONVERSION",
    impressions: 0,
    clicks: ctaClicks,
    leads: leadCaptures,
    bookings: bookingCompleted,
    conversionRate: leadRate,
    evidenceScore,
    evidenceQuality,
    reasons,
    warnings,
  });

  return out;
}

export async function detectLowConversionRetargetingMessages(rangeDays = 14): Promise<LowConversionRow[]> {
  if (!croRetargetingLearningFlags.croSqlLowConversionV1 && !negativeSignalQualityFlags.negativeSignalQualityV1) {
    return [];
  }

  void rangeDays;
  const weakDb = await getWeakRetargetingMessages(30);
  const out: LowConversionRow[] = [];

  if (weakDb.length === 0) {
    const hi = await getRetargetingPerformanceBySegment("highIntent");
    if (hi.length === 0) {
      out.push({
        entityId: "retargeting:none",
        entityKind: "RETARGETING_MESSAGE",
        signalType: "INSUFFICIENT_DATA",
        impressions: 0,
        clicks: 0,
        leads: 0,
        bookings: 0,
        conversionRate: null,
        evidenceScore: 0.15,
        evidenceQuality: "LOW",
        reasons: ["No retargeting performance snapshots with enough clicks."],
        warnings: ["Persist performance or complete bookings with retargeting metadata."],
      });
    }
    return out;
  }

  for (const r of weakDb) {
    if (r.clicks < MIN_RT_CLICKS) continue;
    const cr = r.conversionRate ?? (r.clicks > 0 ? r.bookings / r.clicks : null);
    out.push({
      entityId: `${r.segment}:${r.messageId}`,
      entityKind: "RETARGETING_MESSAGE",
      signalType: "LOW_CONVERSION",
      impressions: r.impressions,
      clicks: r.clicks,
      leads: 0,
      bookings: r.bookings,
      conversionRate: cr,
      evidenceScore: 0.42 + Math.min(0.15, r.clicks / 500),
      evidenceQuality: r.clicks >= 60 ? "MEDIUM" : "LOW",
      reasons: [
        `Message ${r.messageId} in segment ${r.segment} has clicks but no bookings and low conversion proxy.`,
      ],
      warnings: [],
    });
  }

  return out;
}
