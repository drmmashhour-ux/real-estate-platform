import { prisma } from "@/lib/db";
import type { ListingObservationSnapshot } from "../types/listing-observation-snapshot.types";
import type { DomainTarget, MarketplaceSignal, ObservationSnapshot } from "../types/domain.types";
import { buildUnifiedListingObservation } from "./listing-observation-builder.service";
import {
  aggregateSignalsForTarget,
  normalizeCampaignSignals,
  normalizeHostBrokerSignals,
  normalizeLeadSignals,
  safeNormalize,
} from "./signal-normalizer";
import { autonomyLog } from "../internal/autonomy-log";

function newSnapshot(target: DomainTarget, signals: MarketplaceSignal[], facts: Record<string, unknown>): ObservationSnapshot {
  return {
    id: `obs-${target.type}-${target.id ?? "scan"}-${Date.now()}`,
    target,
    signals,
    aggregates: aggregateSignalsForTarget(signals),
    facts,
    builtAt: new Date().toISOString(),
  };
}

export async function buildObservationForListing(listingId: string): Promise<ObservationSnapshot | null> {
  try {
    const unified = await buildUnifiedListingObservation(listingId);
    return unified.observation;
  } catch (e) {
    autonomyLog.signals("buildObservationForListing failed", { listingId, err: String(e) });
    return null;
  }
}

export async function buildObservationForLead(leadId: string): Promise<ObservationSnapshot | null> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        pipelineStage: true,
        score: true,
        createdAt: true,
        lastFollowUpAt: true,
        contactUnlockedAt: true,
        fsboListingId: true,
        introducedByBrokerId: true,
      },
    });
    if (!lead) return null;

    const now = Date.now();
    const hoursSinceCreated = (now - lead.createdAt.getTime()) / 3600000;
    const hoursSinceFollowUp = lead.lastFollowUpAt
      ? (now - lead.lastFollowUpAt.getTime()) / 3600000
      : hoursSinceCreated;

    const leadSigs = safeNormalize(
      () =>
        normalizeLeadSignals({
          leadId,
          pipelineStage: lead.pipelineStage,
          score: lead.score,
          hoursSinceCreated,
          hoursSinceFollowUp,
          followUpAttempts: lead.lastFollowUpAt ? 1 : 0,
          unlocked: !!lead.contactUnlockedAt,
          source: "db.lead",
        }),
      "lead",
    );

    const brokerSigs =
      lead.introducedByBrokerId &&
      safeNormalize(
        () =>
          normalizeHostBrokerSignals({
            userId: lead.introducedByBrokerId,
            brokerLeadTouches: lead.lastFollowUpAt ? 1 : 0,
            source: "db.lead.broker",
          }),
        "broker",
      );

    const signals = [...leadSigs, ...(brokerSigs ?? [])];
    const target: DomainTarget = { type: "lead", id: leadId };
    return newSnapshot(target, signals, {
      fsboListingId: lead.fsboListingId,
      brokerId: lead.introducedByBrokerId,
    });
  } catch (e) {
    autonomyLog.signals("buildObservationForLead failed", { leadId, err: String(e) });
    return null;
  }
}

export async function buildObservationForCampaign(campaignKey: string): Promise<ObservationSnapshot | null> {
  try {
    const row = await prisma.adsAutomationCampaignResult.findFirst({
      where: { campaignKey },
      orderBy: { createdAt: "desc" },
      include: { loopRun: true },
    });
    if (!row) return null;

    const ctr =
      row.ctr ??
      (row.impressions > 0 && row.clicks != null ? row.clicks / row.impressions : undefined);

    const sigs = safeNormalize(
      () =>
        normalizeCampaignSignals({
          campaignKey,
          impressions: row.impressions,
          clicks: row.clicks,
          leads: row.leads,
          spend: row.spend ?? undefined,
          ctr,
          conversionRate: row.conversionRate ?? undefined,
          classification: row.classification,
          source: "db.adsAutomationCampaignResult",
        }),
      "campaign",
    );

    const target: DomainTarget = { type: "campaign", id: campaignKey, label: row.campaignLabel ?? campaignKey };
    return newSnapshot(target, sigs, {
      loopRunId: row.loopRunId,
      loopCreatedAt: row.loopRun.createdAt.toISOString(),
    });
  } catch (e) {
    autonomyLog.signals("buildObservationForCampaign failed", { campaignKey, err: String(e) });
    return null;
  }
}

/**
 * Read-only snapshot: listing price, status, view count, booking-style signals, and a simple conversion rate.
 * Delegates to `buildUnifiedListingObservation` (same DB path as full listing observation).
 */
export async function buildListingObservationSnapshot(
  listingId: string,
): Promise<ListingObservationSnapshot | null> {
  try {
    const unified = await buildUnifiedListingObservation(listingId);
    return unified.snapshot;
  } catch (e) {
    autonomyLog.signals("buildListingObservationSnapshot failed", { listingId, err: String(e) });
    return null;
  }
}
