/**
 * Senior Living vertical — 90-day GTM execution tracker (outreach, replies, onboarding, revenue).
 *
 * Canonical lead count: `SeniorLead` rows (family inquiries). Logged events complement CRM-style tracking.
 * Set `SENIOR_LIVING_GTM_START_ISO` (e.g. launch day) for day/phase KPI math.
 *
 * Strategy constants: one focus city first → expand (see `getFocusMarket()`).
 */
import { prisma } from "@/lib/db";

/** ISO date string — day 1 of the 90-day plan (override via env). */
export function getGtmStartDate(): Date {
  const raw = process.env.SENIOR_LIVING_GTM_START_ISO?.trim();
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  /** Default anchor if unset — replace at launch. */
  return new Date("2026-04-01T00:00:00.000Z");
}

export function getFocusMarket(): { city: string; province: string; countryHint: string } {
  return {
    city: process.env.SENIOR_LIVING_FOCUS_CITY?.trim() || "Montreal",
    province: process.env.SENIOR_LIVING_FOCUS_PROVINCE?.trim() || "QC",
    countryHint: process.env.SENIOR_LIVING_FOCUS_COUNTRY?.trim() || "CA",
  };
}

/** Daily outbound target from the plan (operators contacted per day). */
export const DAILY_OUTREACH_TARGET = 10;

export const GTM_EVENT_TYPES = {
  OUTREACH_SENT: "OUTREACH_SENT",
  OUTREACH_REPLY: "OUTREACH_REPLY",
  OPERATOR_ONBOARDED: "OPERATOR_ONBOARDED",
  /** Optional duplicate log; canonical leads = DB count */
  LEAD_GENERATED: "LEAD_GENERATED",
  REVENUE_RECORDED: "REVENUE_RECORDED",
} as const;

export type GtmEventType = (typeof GTM_EVENT_TYPES)[keyof typeof GTM_EVENT_TYPES];

/** Milestone KPIs from the plan (not interpolated — used for gap at days 30/60/90). */
export const KPI_MILESTONES = {
  day30: { operators: 10, leads: 20, phase: 2 as const },
  day60: { operators: 50, leads: 100, phase: 3 as const },
  day90: { operators: 100, leads: 300, phase: 4 as const },
} as const;

export function daysSinceGtmStart(now = new Date()): number {
  const start = getGtmStartDate();
  const ms = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

/** 1–4: days 1–14 | 15–30 | 31–60 | 61–90+ (dayIndex 0 = launch day). */
export function getGtmPhase(dayIndex: number): 1 | 2 | 3 | 4 {
  if (dayIndex < 15) return 1;
  if (dayIndex < 31) return 2;
  if (dayIndex < 61) return 3;
  return 4;
}

/**
 * Linear ramp expectation toward the next milestone (simple “on track” heuristic).
 * Day 15 expects halfway between 0 and day-30 targets for operators/leads.
 */
export function expectedOperatorsByDay(dayIndex: number): number {
  if (dayIndex <= 0) return 0;
  if (dayIndex <= 30) return (dayIndex / 30) * KPI_MILESTONES.day30.operators;
  if (dayIndex <= 60) {
    const a = KPI_MILESTONES.day30.operators;
    const b = KPI_MILESTONES.day60.operators;
    return a + ((dayIndex - 30) / 30) * (b - a);
  }
  const a = KPI_MILESTONES.day60.operators;
  const b = KPI_MILESTONES.day90.operators;
  return a + ((dayIndex - 60) / 30) * (b - a);
}

export function expectedLeadsByDay(dayIndex: number): number {
  if (dayIndex <= 0) return 0;
  if (dayIndex <= 30) return (dayIndex / 30) * KPI_MILESTONES.day30.leads;
  if (dayIndex <= 60) {
    const a = KPI_MILESTONES.day30.leads;
    const b = KPI_MILESTONES.day60.leads;
    return a + ((dayIndex - 30) / 30) * (b - a);
  }
  const a = KPI_MILESTONES.day60.leads;
  const b = KPI_MILESTONES.day90.leads;
  return a + ((dayIndex - 60) / 30) * (b - a);
}

export async function recordGtmExecutionEvent(input: {
  eventType: GtmEventType | string;
  quantity?: number;
  operatorUserId?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt?: Date;
}) {
  const eventType = String(input.eventType).toUpperCase().slice(0, 40);
  const quantity = Math.max(1, Math.min(10_000, input.quantity ?? 1));
  return prisma.seniorLivingGtmExecutionEvent.create({
    data: {
      eventType,
      quantity,
      operatorUserId: input.operatorUserId?.trim() || null,
      notes: input.notes?.trim().slice(0, 4000) ?? null,
      metadata: input.metadata ?? undefined,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}

export async function countGtmEventsSince(
  eventType: GtmEventType | string,
  since: Date
): Promise<number> {
  const u = String(eventType).toUpperCase().slice(0, 40);
  const agg = await prisma.seniorLivingGtmExecutionEvent.aggregate({
    where: { eventType: u, occurredAt: { gte: since } },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

/** Distinct operators with at least one senior residence (proxy for “onboarded operator”). */
export async function countSeniorLivingOperators(): Promise<number> {
  const rows = await prisma.seniorResidence.groupBy({
    by: ["operatorId"],
    where: { operatorId: { not: null } },
  });
  return rows.length;
}

export async function countSeniorLivingListings(): Promise<number> {
  return prisma.seniorResidence.count();
}

export async function countSeniorLeadsSince(since: Date): Promise<number> {
  return prisma.seniorLead.count({
    where: { createdAt: { gte: since } },
  });
}

export type GtmExecutionSummary = {
  gtmStart: string;
  dayIndex: number;
  phase: 1 | 2 | 3 | 4;
  focusMarket: ReturnType<typeof getFocusMarket>;
  outreachSent: number;
  outreachReplies: number;
  onboardedEvents: number;
  revenueEvents: number;
  operators: number;
  listings: number;
  leadsSinceStart: number;
  expectedOperators: number;
  expectedLeads: number;
  onTrackOperators: boolean;
  onTrackLeads: boolean;
  dailyOutreachTarget: number;
};

export async function getGtmExecutionSummary(now = new Date()): Promise<GtmExecutionSummary> {
  const start = getGtmStartDate();
  const dayIndex = daysSinceGtmStart(now);
  const phase = getGtmPhase(dayIndex);

  const [outreachSent, outreachReplies, onboardedEvents, revenueEvents, operators, listings, leadsSinceStart] =
    await Promise.all([
      countGtmEventsSince(GTM_EVENT_TYPES.OUTREACH_SENT, start),
      countGtmEventsSince(GTM_EVENT_TYPES.OUTREACH_REPLY, start),
      countGtmEventsSince(GTM_EVENT_TYPES.OPERATOR_ONBOARDED, start),
      countGtmEventsSince(GTM_EVENT_TYPES.REVENUE_RECORDED, start),
      countSeniorLivingOperators(),
      countSeniorLivingListings(),
      countSeniorLeadsSince(start),
    ]);

  const expectedOperators = expectedOperatorsByDay(dayIndex);
  const expectedLeads = expectedLeadsByDay(dayIndex);
  const onTrackOperators = operators >= expectedOperators * 0.85;
  const onTrackLeads = leadsSinceStart >= expectedLeads * 0.85;

  return {
    gtmStart: start.toISOString(),
    dayIndex,
    phase,
    focusMarket: getFocusMarket(),
    outreachSent,
    outreachReplies,
    onboardedEvents,
    revenueEvents,
    operators,
    listings,
    leadsSinceStart,
    expectedOperators: Math.round(expectedOperators * 10) / 10,
    expectedLeads: Math.round(expectedLeads * 10) / 10,
    onTrackOperators,
    onTrackLeads,
    dailyOutreachTarget: DAILY_OUTREACH_TARGET,
  };
}

/** Weekly feedback loop reminders (UX, matching, onboarding). */
export function getWeeklyFeedbackChecklist(): string[] {
  return [
    "Review senior living UX (large type, simple mode, guided search).",
    "Review matching explanations and outcome weights (`/api/learning/update`).",
    "Spot-check operator onboarding and listing quality in the focus city.",
    "Read last week’s outreach replies and adjust messaging.",
  ];
}

/** Sales loop summary for internal dashboards. */
export function describeSalesLoops(): { operator: string; platform: string } {
  return {
    operator: "Lead → visit → contract (operator closes on site).",
    platform: "Lead → platform fee → repeat (price per lead / subscription as you enable billing).",
  };
}
