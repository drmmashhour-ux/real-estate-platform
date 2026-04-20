/**
 * Single read path for FSBO listing preview — derives metrics snapshot + observation together (no writes).
 */

import { prisma } from "@/lib/db";
import { brokerAiFlags } from "@/config/feature-flags";
import { buildCertificateLocationObservationFacts } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-observation-bridge.service";
import type { ListingObservationSnapshot } from "../types/listing-observation-snapshot.types";
import type { DomainTarget, MarketplaceSignal, ObservationSnapshot } from "../types/domain.types";
import {
  aggregateSignalsForTarget,
  normalizeListingSignals,
  safeNormalize,
} from "./signal-normalizer";
import { autonomyLog } from "../internal/autonomy-log";

export type UnifiedListingObservation = {
  snapshot: ListingObservationSnapshot | null;
  observation: ObservationSnapshot | null;
};

function newObservationSnapshot(target: DomainTarget, signals: MarketplaceSignal[], facts: Record<string, unknown>): ObservationSnapshot {
  const stableId = target.id ? `obs-${target.type}-${target.id}-preview` : `obs-${target.type}-unknown-preview`;
  return {
    id: stableId,
    target,
    signals,
    aggregates: aggregateSignalsForTarget(signals),
    facts,
    builtAt: new Date().toISOString(),
  };
}

/**
 * One coordinated load for preview: metrics row + full observation (signals + facts).
 * Falls back safely when listing is missing — no throws.
 */
export async function buildUnifiedListingObservation(listingId: string): Promise<UnifiedListingObservation> {
  try {
    const [listing, bookingRequestCount, latestPerf] = await Promise.all([
      prisma.fsboListing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          moderationStatus: true,
          priceCents: true,
          city: true,
          images: true,
          experienceTags: true,
          createdAt: true,
          metrics: true,
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
      return { snapshot: null, observation: null };
    }

    const views = listing._count.buyerListingViews;
    const saves = listing._count.buyerSavedListings;
    const contacts = listing._count.buyerHubCrmLeads;
    const conversionRate = views > 0 ? (contacts + saves * 0.25) / views : 0;
    const created = listing.createdAt.getTime();
    const daysOnMarket = Math.max(0, Math.floor((Date.now() - created) / 86400000));

    const titleLen = listing.title?.length ?? 0;
    const descriptionLen = listing.description?.length ?? 0;
    const photoCount = listing.images?.length ?? 0;
    const amenitiesScore = Array.isArray(listing.experienceTags) ? (listing.experienceTags as unknown[]).length : 0;

    const perfBookings = latestPerf?.bookings ?? 0;
    const bookings = Math.max(perfBookings, bookingRequestCount);

    const snapshot: ListingObservationSnapshot = {
      views,
      bookings,
      conversionRate,
      price: listing.priceCents,
      listingStatus: listing.status,
    };

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
          source: "db.fsboListing.unified",
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

    if (brokerAiFlags.brokerAiCertificateOfLocationV2) {
      try {
        const cert = await buildCertificateLocationObservationFacts(listingId);
        if (cert) facts.certificateOfLocationV2 = cert;
      } catch {
        /* noop — observation stays without certificate facts */
      }
    }

    const observation = newObservationSnapshot(target, signals, facts);

    return { snapshot, observation };
  } catch (e) {
    autonomyLog.signals("buildUnifiedListingObservation failed", { listingId, err: String(e) });
    return { snapshot: null, observation: null };
  }
}
