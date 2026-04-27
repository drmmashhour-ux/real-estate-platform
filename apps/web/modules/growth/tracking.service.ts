import type { Prisma } from "@prisma/client";
import { logInfo } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { resolveGrowthAttributionFromRequest } from "@/modules/attribution/attribution.service";
import { mergeExperimentRootsIntoClientMeta } from "@/modules/experiments/experiment-attribution.service";
import { GrowthEventName, type GrowthEventNameType } from "./event-types";
import { maybeIngestUnifiedFromGrowthMetadata } from "./unified-learning.service";

export type RecordGrowthEventParams = {
  eventName: GrowthEventNameType;
  userId?: string | null;
  sessionId?: string | null;
  idempotencyKey?: string | null;
  metadata?: Prisma.InputJsonValue;
  cookieHeader?: string | null;
  body?: unknown;
  pageUrl?: string | null;
  referrerHeader?: string | null;
};

/** Events that must never be inserted from anonymous client beacons (server / verified flows only). */
export const GROWTH_SERVER_ONLY_EVENTS = new Set<GrowthEventNameType>([
  GrowthEventName.SIGNUP_SUCCESS,
  GrowthEventName.BOOKING_COMPLETED,
  GrowthEventName.HOST_SIGNUP,
  GrowthEventName.LOGIN,
  GrowthEventName.LISTING_CREATED,
  GrowthEventName.DEAL_CREATED,
  GrowthEventName.LEAD_CAPTURE,
  GrowthEventName.GROWTH_EXECUTION_AI_VIEW,
  GrowthEventName.GROWTH_EXECUTION_AI_COPY,
  GrowthEventName.GROWTH_EXECUTION_AI_ACK,
  GrowthEventName.GROWTH_EXECUTION_AI_IGNORE,
]);

/** Subset allowed from `/api/analytics/track` ingest (deterministic, non-repudiation marketing signals). */
export const GROWTH_CLIENT_ALLOWED_EVENTS = new Set<GrowthEventNameType>([
  GrowthEventName.PAGE_VIEW,
  GrowthEventName.LANDING_VIEW,
  GrowthEventName.SEARCH,
  GrowthEventName.LISTING_VIEW,
  GrowthEventName.BOOKING_STARTED,
  GrowthEventName.BROKER_LEAD,
  GrowthEventName.CTA_CLICK,
  GrowthEventName.AB_EXPOSURE,
]);

const TRAFFIC_TO_GROWTH: Record<string, GrowthEventNameType> = {
  page_view: GrowthEventName.PAGE_VIEW,
  landing_view: GrowthEventName.LANDING_VIEW,
  search: GrowthEventName.SEARCH,
  listing_view: GrowthEventName.LISTING_VIEW,
  booking_started: GrowthEventName.BOOKING_STARTED,
  broker_lead: GrowthEventName.BROKER_LEAD,
  cta_click: GrowthEventName.CTA_CLICK,
  ab_exposure: GrowthEventName.AB_EXPOSURE,
};

export function trafficEventTypeToGrowthName(eventType: string): GrowthEventNameType | null {
  return TRAFFIC_TO_GROWTH[eventType] ?? null;
}

/** Lifts `cro` / `retargeting` onto metadata root (same idea as A/B merge). */
export function mergeCroRetargetingRootsIntoClientMeta(meta: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!meta || typeof meta !== "object") return {};
  const out: Record<string, unknown> = {};
  if (meta.cro && typeof meta.cro === "object" && !Array.isArray(meta.cro)) out.cro = meta.cro;
  if (meta.retargeting && typeof meta.retargeting === "object" && !Array.isArray(meta.retargeting)) {
    out.retargeting = meta.retargeting;
  }
  return out;
}

const SENSITIVE_KEYS = /^(password|token|secret|authorization|cookie|set-cookie|apikey|api_key)$/i;

function sanitizeGrowthPayload(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (SENSITIVE_KEYS.test(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 2000);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
    else if (v === null) out[k] = null;
  }
  return out;
}

/**
 * Server-side funnel write to `growth_events` — use for API routes and webhooks.
 * Strips sensitive keys from `payload` before JSON persistence.
 */
export async function trackGrowthSystemEvent(
  eventName: GrowthEventNameType,
  payload: Record<string, unknown> | undefined,
  rest: Omit<RecordGrowthEventParams, "eventName" | "metadata">,
): Promise<{ ok: true; duplicate?: boolean } | { ok: false }> {
  const meta = payload ? sanitizeGrowthPayload(payload) : undefined;
  try {
    return await recordGrowthEvent({
      ...rest,
      eventName,
      metadata:
        meta && Object.keys(meta).length > 0 ? asInputJsonValue(meta as Record<string, unknown>) : undefined,
    });
  } catch {
    return { ok: false };
  }
}

/**
 * Insert one row into `growth_events`. Uses `idempotencyKey` when provided (unique constraint).
 */
export async function recordGrowthEvent(
  input: RecordGrowthEventParams
): Promise<{ ok: true; duplicate?: boolean }> {
  const attr = resolveGrowthAttributionFromRequest({
    cookieHeader: input.cookieHeader,
    body: input.body,
    pageUrl: input.pageUrl ?? undefined,
    referrerHeader: input.referrerHeader,
  });

  const metaObj =
    input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? (input.metadata as Record<string, unknown>)
      : {};
  const ts = new Date().toISOString();
  const rtClient =
    metaObj.retargeting && typeof metaObj.retargeting === "object" && !Array.isArray(metaObj.retargeting)
      ? (metaObj.retargeting as Record<string, unknown>)
      : {};
  const croClient =
    metaObj.cro && typeof metaObj.cro === "object" && !Array.isArray(metaObj.cro)
      ? (metaObj.cro as Record<string, unknown>)
      : {};

  const mergedMeta: Prisma.InputJsonValue = {
    ...metaObj,
    cro: Object.keys(croClient).length > 0 ? { ...croClient } : metaObj.cro,
    retargeting: {
      ...rtClient,
      sessionId: (rtClient.sessionId as string | undefined) ?? input.sessionId ?? null,
      userId: (rtClient.userId as string | undefined) ?? input.userId ?? null,
      emittedAt: ts,
    },
    /** KPI export: mirrors row columns + authoritative event time for analytics / ads scaling / retargeting. */
    kpi: {
      utm_source: attr.utmSource ?? null,
      utm_campaign: attr.utmCampaign ?? null,
      utm_medium: attr.utmMedium ?? null,
      utm_term: attr.utmTerm ?? null,
      utm_content: attr.utmContent ?? null,
      timestamp: ts,
    },
  };

  const metaForLearning =
    mergedMeta && typeof mergedMeta === "object" && !Array.isArray(mergedMeta)
      ? (mergedMeta as Record<string, unknown>)
      : {};

  try {
    const row = await prisma.growthEvent.create({
      data: {
        eventName: input.eventName,
        userId: input.userId ?? undefined,
        sessionId: input.sessionId?.slice(0, 64) ?? undefined,
        idempotencyKey: input.idempotencyKey?.slice(0, 160) ?? undefined,
        metadata: mergedMeta,
        utmSource: attr.utmSource,
        utmMedium: attr.utmMedium,
        utmCampaign: attr.utmCampaign,
        utmTerm: attr.utmTerm,
        utmContent: attr.utmContent,
        referrer: attr.referrer,
      },
      select: { id: true },
    });

    maybeIngestUnifiedFromGrowthMetadata(input.eventName, metaForLearning);
    void persistLearningSignalsFromGrowthEvent({
      growthEventId: row.id,
      eventName: input.eventName,
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
      metadata: metaForLearning,
    });

    return { ok: true };
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : undefined;
    if (code === "P2002") {
      return { ok: true, duplicate: true };
    }
    throw e;
  }
}

export async function appendGrowthEventFromClientIngest(input: {
  trafficEventType: string;
  userId: string | null;
  sessionId: string | null;
  path: string | null;
  meta: Record<string, unknown> | null;
  cookieHeader: string | null;
  body: unknown;
  referrerHeader: string | null;
}): Promise<void> {
  const growthName = trafficEventTypeToGrowthName(input.trafficEventType);
  if (!growthName || !GROWTH_CLIENT_ALLOWED_EVENTS.has(growthName)) return;

  const pageUrl = input.path
    ? input.path.startsWith("http")
      ? input.path
      : `https://lecipm.local${input.path.startsWith("/") ? "" : "/"}${input.path}`
    : null;

  const dedupe =
    typeof input.meta?.growthDedupeKey === "string"
      ? input.meta.growthDedupeKey.trim().slice(0, 160)
      : null;
  const idempotencyKey =
    dedupe ??
    (growthName === GrowthEventName.PAGE_VIEW
      ? null
      : `${growthName}:${input.sessionId ?? "anon"}:${(input.path ?? "").slice(0, 200)}`.slice(0, 160));

  const abFlat = input.meta ? mergeExperimentRootsIntoClientMeta(input.meta) : {};

  await recordGrowthEvent({
    eventName: growthName,
    userId: input.userId,
    sessionId: input.sessionId,
    idempotencyKey,
    metadata: asInputJsonValue({
      path: input.path,
      ...abFlat,
      ...(input.meta && Object.keys(input.meta).length > 0 ? { clientMeta: input.meta } : {}),
    }),
    cookieHeader: input.cookieHeader,
    body: input.body,
    pageUrl,
    referrerHeader: input.referrerHeader,
  }).catch(() => {});
}

/** Structured log for autonomous growth optimizer runs (dashboard SSR + cron). Does not mutate spend. */
export function logGrowthAutonomousOptimizerRun(payload: {
  healthScore: number;
  leakCount: number;
  campaignCount: number;
  decisions: { id: string; action: string }[];
}): void {
  logInfo("[growth.autonomous.optimizer]", payload);
}
