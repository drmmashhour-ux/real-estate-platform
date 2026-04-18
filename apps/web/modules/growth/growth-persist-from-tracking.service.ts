/**
 * Persist CRO / retargeting learning rows after growth_events writes (feature-gated; best-effort).
 */
import { logWarning } from "@/lib/logger";
import { croRetargetingDurabilityFlags, croRetargetingLearningFlags } from "@/config/feature-flags";
import { GrowthEventName } from "./event-types";
import { createCroSignals, createRetargetingSignals, type CreateCroSignalInput, type CreateRetargetingSignalInput } from "./cro-retargeting-learning.repository";

function croMeta(meta: Record<string, unknown>): Record<string, unknown> | undefined {
  const c = meta.cro;
  if (c && typeof c === "object" && !Array.isArray(c)) return c as Record<string, unknown>;
  return undefined;
}

function rtMeta(meta: Record<string, unknown>): Record<string, unknown> | undefined {
  const r = meta.retargeting;
  if (r && typeof r === "object" && !Array.isArray(r)) return r as Record<string, unknown>;
  return undefined;
}

function listingFromMeta(meta: Record<string, unknown>, cro: Record<string, unknown> | undefined): string | null {
  const a = meta.listingId ?? meta.listing_id ?? cro?.listingId;
  return typeof a === "string" && a.trim() ? a.trim() : null;
}

/**
 * Best-effort persistence — never throws to callers.
 */
export async function persistLearningSignalsFromGrowthEvent(input: {
  growthEventId: string;
  eventName: string;
  userId?: string | null;
  sessionId?: string | null;
  metadata: Record<string, unknown>;
}): Promise<void> {
  if (
    !croRetargetingLearningFlags.croRetargetingPersistenceV1 &&
    !croRetargetingDurabilityFlags.croRetargetingDurabilityV1
  ) {
    return;
  }

  const cro = croMeta(input.metadata);
  const rt = rtMeta(input.metadata);
  const baseMeta = { growthEventId: input.growthEventId, eventName: input.eventName };

  try {
    const croRows: CreateCroSignalInput[] = [];
    const rtRows: CreateRetargetingSignalInput[] = [];

    if (input.eventName === GrowthEventName.LEAD_CAPTURE && cro && cro.trustBlock === true) {
      const lowData = !cro.ctaId && !cro.trustVariant;
      croRows.push({
        sourceGrowthEventId: input.growthEventId,
        listingId: listingFromMeta(input.metadata, cro),
        sessionId: input.sessionId ?? null,
        userId: input.userId ?? null,
        ctaId: typeof cro.ctaId === "string" ? cro.ctaId : null,
        ctaVariant: typeof cro.ctaVariant === "string" ? cro.ctaVariant : null,
        ctaPosition: typeof cro.ctaPosition === "string" ? cro.ctaPosition : null,
        trustBlock: true,
        trustVariant: typeof cro.trustVariant === "string" ? cro.trustVariant : null,
        signalType: "TRUST_LIFT",
        confidenceScore: lowData ? 0.35 : 0.65,
        evidenceScore: lowData ? 0.25 : 0.55,
        metadata: { ...baseMeta, lowData },
      });
    }

    if (input.eventName === GrowthEventName.BOOKING_STARTED && cro) {
      const hasCta = Boolean(cro.ctaId || cro.ctaVariant);
      const hasUrgency = cro.urgencyShown === true;
      if (!hasCta && !hasUrgency) {
        /* skip — not enough structure */
      } else {
        const lowData = !hasCta;
        croRows.push({
          sourceGrowthEventId: input.growthEventId,
          listingId: listingFromMeta(input.metadata, cro),
          sessionId: input.sessionId ?? null,
          userId: input.userId ?? null,
          ctaId: typeof cro.ctaId === "string" ? cro.ctaId : null,
          ctaVariant: typeof cro.ctaVariant === "string" ? cro.ctaVariant : null,
          ctaPosition: typeof cro.ctaPosition === "string" ? cro.ctaPosition : null,
          urgencyShown: cro.urgencyShown === true ? true : null,
          urgencyType: typeof cro.urgencyType === "string" ? cro.urgencyType : null,
          signalType: "BOOKING_STARTED_CRO",
          confidenceScore: lowData ? 0.4 : 0.72,
          evidenceScore: lowData ? 0.3 : 0.62,
          metadata: { ...baseMeta, lowData },
        });
        if (hasUrgency) {
          croRows.push({
            sourceGrowthEventId: `${input.growthEventId}:urgency`,
            listingId: listingFromMeta(input.metadata, cro),
            sessionId: input.sessionId ?? null,
            userId: input.userId ?? null,
            ctaId: typeof cro.ctaId === "string" ? cro.ctaId : null,
            ctaVariant: typeof cro.ctaVariant === "string" ? cro.ctaVariant : null,
            urgencyShown: true,
            urgencyType: typeof cro.urgencyType === "string" ? cro.urgencyType : null,
            signalType: "URGENCY_LIFT",
            confidenceScore: 0.64,
            evidenceScore: 0.52,
            metadata: baseMeta,
          });
        }
      }
    }

    if (input.eventName === GrowthEventName.BOOKING_COMPLETED && rt && typeof rt.messageId === "string" && rt.messageId.trim()) {
      rtRows.push({
        sourceGrowthEventId: input.growthEventId,
        segment: typeof rt.segment === "string" ? rt.segment : null,
        messageId: rt.messageId.trim(),
        messageVariant: typeof rt.messageVariant === "string" ? rt.messageVariant : null,
        urgency: typeof rt.urgency === "string" ? rt.urgency : null,
        sessionId: input.sessionId ?? null,
        userId: input.userId ?? null,
        signalType: "BOOKING_WIN",
        confidenceScore: 0.8,
        evidenceScore: 0.75,
        metadata: baseMeta,
      });
    }

    if (croRows.length) await createCroSignals(croRows);
    if (rtRows.length) await createRetargetingSignals(rtRows);
  } catch (e) {
    logWarning("[growth-persist-from-tracking] persist failed", { err: String(e) });
  }
}
