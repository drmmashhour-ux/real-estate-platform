import { prisma } from "@/lib/db";
import { abTestingFlags, engineFlags } from "@/config/feature-flags";
import type { AbMetadataPayload } from "./ab-testing.types";

const TRACKED_FOR_EXPERIMENT = new Set([
  "landing_view",
  "page_view",
  "cta_click",
  "booking_started",
  "booking_completed",
  "search",
  "listing_view",
]);

function mapTrafficToExperimentEvent(trafficEventType: string): string | null {
  if (TRACKED_FOR_EXPERIMENT.has(trafficEventType)) return trafficEventType;
  return null;
}

/**
 * Persists a row in `experiment_events` for funnel analysis — additive to growth_events.
 */
export async function recordExperimentEventsFromTracking(params: {
  trafficEventType: string;
  userId: string | null;
  sessionId: string | null;
  meta: Record<string, unknown> | null | undefined;
}): Promise<void> {
  if (!abTestingFlags.abTestingV1 && !engineFlags.experimentsV1) return;
  const raw = params.meta?.ab;
  if (!raw || typeof raw !== "object") return;
  const ab = raw as Partial<AbMetadataPayload>;
  const experimentId = typeof ab.experimentId === "string" ? ab.experimentId : null;
  const variantId = typeof ab.variantId === "string" ? ab.variantId : null;
  if (!experimentId || !variantId) return;

  const eventName = mapTrafficToExperimentEvent(params.trafficEventType);
  if (!eventName) return;

  await prisma.experimentEvent
    .create({
      data: {
        experimentId,
        variantId,
        userId: params.userId,
        sessionId: (params.sessionId ?? "anon").slice(0, 128),
        eventName,
        metadataJson: { trafficEventType: params.trafficEventType },
      },
    })
    .catch(() => {});
}

/** Flattens A/B ids onto growth metadata root for legacy SQL (`metadata->>'experimentId'`). */
export function mergeExperimentRootsIntoClientMeta(meta: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!meta || typeof meta !== "object") return {};
  const out: Record<string, unknown> = {};
  const ab = meta.ab;
  if (ab && typeof ab === "object") {
    const o = ab as Record<string, unknown>;
    if (typeof o.experimentId === "string") out.experimentId = o.experimentId;
    if (typeof o.variantKey === "string") out.variant = o.variantKey;
    out.ab = ab;
  }
  if (typeof meta.experimentId === "string") out.experimentId = meta.experimentId;
  if (typeof meta.experiment === "string") out.experiment = meta.experiment;
  if (typeof meta.variant === "string") out.variant = meta.variant;
  return out;
}
