import { prisma } from "@/lib/db";
import type { ListingObservationSnapshot } from "../types/listing-observation-snapshot.types";
import type { DomainTarget, MarketplaceSignal, ObservationSnapshot } from "../types/domain.types";
import {
  aggregateSignalsForTarget,
  normalizeCampaignSignals,
  normalizeHostBrokerSignals,
  normalizeLeadSignals,
  normalizeListingSignals,
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
    const listing = await prisma.fsboListing.findUnique({
      where: { id: listingId },
      include: {
        metrics: true,
        buyerListingViews: { select: { id: true }, take: 500 },
        buyerSavedListings: { select: { id: true }, take: 200 },
        buyerHubCrmLeads: { select: { id: true }, take: 100 },
      },
    });
    if (!listing) return null;

    const views = listing.buyerListingViews.length;
    const saves = listing.buyerSavedListings.length;
    const contacts = listing.buyerHubCrmLeads.length;
    const conversionRate = views > 0 ? (contacts + saves * 0.25) / views : 0;
    const created = listing.createdAt.getTime();
    const daysOnMarket = Math.max(0, Math.floor((Date.now() - created) / (86400000)));

    const titleLen = listing.title?.length ?? 0;
    const descriptionLen = listing.description?.length ?? 0;
    const photoCount = listing.images?.length ?? 0;
    const amenitiesScore = Array.isArray(listing.experienceTags)
      ? (listing.experienceTags as unknown[]).length
      : 0;

    const listingSigs = safeNormalize(
      () =>
        normalizeListingSignals({
          listingId,
          views,
          saves,
          contacts,
          conversionRate,
          daysOnMarket,
          titleLen,
          descriptionLen,
          photoCount,
          amenitiesScore,
          source: "db.fsboListing",
        }),
      "listing",
    );

    const signals = [...listingSigs];
    const target: DomainTarget = { type: "fsbo_listing", id: listingId, label: listing.title };
    const facts: Record<string, unknown> = {
      status: listing.status,
      moderationStatus: listing.moderationStatus,
      priceCents: listing.priceCents,
      city: listing.city,
      hasMetrics: !!listing.metrics,
      conversionScore: listing.metrics?.conversionScore ?? null,
      priceSuggestedCents: listing.metrics?.priceSuggestedCents ?? null,
      daysOnMarket,
    };

    return newSnapshot(target, signals, facts);
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
 * No writes. No detectors. Aligns view/save/contact math with `buildObservationForListing`.
 */
export async function buildListingObservationSnapshot(
  listingId: string,
): Promise<ListingObservationSnapshot | null> {
  try {
    const [listing, bookingRequestCount, latestPerf] = await Promise.all([
      prisma.fsboListing.findUnique({
        where: { id: listingId },
        select: {
          status: true,
          priceCents: true,
          title: true,
          _count: {
            select: {
              buyerListingViews: true,
              buyerSavedListings: true,
              buyerHubCrmLeads: true,
            },
          },
        },
      }),
      prisma.immoContactLog.count({
        where: { listingId, contactType: "BOOKING_REQUEST" },
      }),
      prisma.hostListingPerformanceSnapshot.findFirst({
        where: { fsboListingId: listingId },
        orderBy: { createdAt: "desc" },
        select: { bookings: true },
      }),
    ]);

    if (!listing) {
      return null;
    }

    const views = listing._count.buyerListingViews;
    const saves = listing._count.buyerSavedListings;
    const contacts = listing._count.buyerHubCrmLeads;
    const conversionRate = views > 0 ? (contacts + saves * 0.25) / views : 0;

    const perfBookings = latestPerf?.bookings ?? 0;
    const bookings = Math.max(perfBookings, bookingRequestCount);

    return {
      views,
      bookings,
      conversionRate,
      price: listing.priceCents,
      listingStatus: listing.status,
    };
  } catch (e) {
    autonomyLog.signals("buildListingObservationSnapshot failed", { listingId, err: String(e) });
    return null;
  }
}
