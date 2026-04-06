import { createHash } from "crypto";
import type { InsuranceLeadFunnelEventType, InsuranceLeadSource, InsuranceLeadType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type LeadAnalyticsEventName = "lead_form_viewed" | "lead_started" | "lead_submitted" | "lead_failed";

export type LeadFunnelSource = "booking" | "listing" | "payment" | "manual";

export type TrackLeadEventPayload = {
  source: InsuranceLeadSource;
  leadType?: InsuranceLeadType;
  device: "web" | "mobile";
  leadId?: string | null;
  variantId?: string | null;
  metadata?: Record<string, unknown>;
  /** Raw client IP — stored only as a salted hash. */
  clientIp?: string | null;
};

const EVENT_MAP: Record<LeadAnalyticsEventName, InsuranceLeadFunnelEventType> = {
  lead_form_viewed: "LEAD_FORM_VIEWED",
  lead_started: "LEAD_STARTED",
  lead_submitted: "LEAD_SUBMITTED",
  lead_failed: "LEAD_FAILED",
};

export function mapInsuranceSourceToFunnel(source: InsuranceLeadSource): LeadFunnelSource {
  switch (source) {
    case "BNBHUB":
      return "booking";
    case "LISTING":
      return "listing";
    case "CHECKOUT":
      return "payment";
    default:
      return "manual";
  }
}

function hashIp(ip: string | null | undefined): string | null {
  if (!ip || ip === "unknown") return null;
  const salt = process.env.INSURANCE_FUNNEL_IP_SALT?.trim() || "insurance_funnel_dev_salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Persist a funnel event (best-effort; errors are swallowed to avoid breaking UX).
 */
export async function trackLeadEvent(eventName: LeadAnalyticsEventName, payload: TrackLeadEventPayload): Promise<void> {
  try {
    const eventType = EVENT_MAP[eventName];
    await prisma.insuranceLeadFunnelEvent.create({
      data: {
        eventType,
        funnelSource: mapInsuranceSourceToFunnel(payload.source),
        leadType: payload.leadType ?? undefined,
        device: payload.device,
        leadId: payload.leadId ?? undefined,
        variantId: payload.variantId ?? undefined,
        metadata:
          payload.metadata != null ? (payload.metadata as Prisma.InputJsonValue) : undefined,
        ipHash: hashIp(payload.clientIp ?? null),
      },
    });
  } catch {
    // non-blocking
  }
}

export type LeadConversionStats = {
  windowDays: number;
  totalViews: number;
  totalStarts: number;
  totalSubmissions: number;
  totalFailures: number;
  viewToSubmitPct: number | null;
  startToSubmitPct: number | null;
};

const DEFAULT_WINDOW_DAYS = 30;

/**
 * Funnel conversion rates from stored events (not from lead rows).
 */
export async function getLeadConversionStats(params?: { since?: Date; windowDays?: number }): Promise<LeadConversionStats> {
  const windowDays = params?.windowDays ?? DEFAULT_WINDOW_DAYS;
  const since = params?.since ?? new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const grouped = await prisma.insuranceLeadFunnelEvent.groupBy({
    by: ["eventType"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  for (const row of grouped) {
    counts[row.eventType] = row._count._all;
  }

  const totalViews = counts.LEAD_FORM_VIEWED ?? 0;
  const totalStarts = counts.LEAD_STARTED ?? 0;
  const totalSubmissions = counts.LEAD_SUBMITTED ?? 0;
  const totalFailures = counts.LEAD_FAILED ?? 0;

  const viewToSubmitPct = totalViews > 0 ? (100 * totalSubmissions) / totalViews : null;
  const startToSubmitPct = totalStarts > 0 ? (100 * totalSubmissions) / totalStarts : null;

  return {
    windowDays,
    totalViews,
    totalStarts,
    totalSubmissions,
    totalFailures,
    viewToSubmitPct,
    startToSubmitPct,
  };
}

export type FunnelBreakdownRow = { funnelSource: string; submissions: number };

export async function getLeadSubmissionsByFunnelSource(params?: { since?: Date; windowDays?: number }) {
  const windowDays = params?.windowDays ?? DEFAULT_WINDOW_DAYS;
  const since = params?.since ?? new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const rows = await prisma.insuranceLeadFunnelEvent.groupBy({
    by: ["funnelSource"],
    where: { createdAt: { gte: since }, eventType: "LEAD_SUBMITTED" },
    _count: { _all: true },
  });

  return rows.map((r) => ({
    funnelSource: r.funnelSource,
    submissions: r._count._all,
  })) satisfies FunnelBreakdownRow[];
}

export type LeadTypeBreakdownRow = { leadType: string; count: number };

export async function getLeadSubmissionsByLeadType(params?: { since?: Date; windowDays?: number }) {
  const windowDays = params?.windowDays ?? DEFAULT_WINDOW_DAYS;
  const since = params?.since ?? new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const rows = await prisma.insuranceLeadFunnelEvent.groupBy({
    by: ["leadType"],
    where: { createdAt: { gte: since }, eventType: "LEAD_SUBMITTED" },
    _count: { _all: true },
  });

  return rows
    .filter((r) => r.leadType != null)
    .map((r) => ({ leadType: r.leadType as string, count: r._count._all })) satisfies LeadTypeBreakdownRow[];
}
