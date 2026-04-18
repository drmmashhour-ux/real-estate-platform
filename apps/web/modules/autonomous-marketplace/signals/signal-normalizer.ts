import type {
  BookingConversionSignal,
  CampaignPerformanceSignal,
  HostBrokerEngagementSignal,
  LeadFunnelSignal,
  ListingPerformanceSignal,
  MarketplaceSignal,
} from "../types/domain.types";
import { autonomyLog } from "../internal/autonomy-log";

export function normalizeListingSignals(input: {
  listingId: string;
  views?: number;
  saves?: number;
  contacts?: number;
  conversionRate?: number;
  daysOnMarket?: number;
  titleLen?: number;
  descriptionLen?: number;
  photoCount?: number;
  amenitiesScore?: number;
  source?: string;
}): ListingPerformanceSignal[] {
  const observedAt = new Date().toISOString();
  const sig: ListingPerformanceSignal = {
    id: `lst-${input.listingId}-${observedAt}`,
    signalType: "listing_performance",
    observedAt,
    source: input.source ?? "normalizer.listing",
    confidence: 0.85,
    explanation: "Normalized FSBO listing engagement snapshot.",
    metadata: {
      listingId: input.listingId,
      views: input.views,
      saves: input.saves,
      contacts: input.contacts,
      conversionRate: input.conversionRate,
      daysOnMarket: input.daysOnMarket,
      titleLen: input.titleLen,
      descriptionLen: input.descriptionLen,
      photoCount: input.photoCount,
      amenitiesScore: input.amenitiesScore,
    },
  };
  return [sig];
}

export function normalizeCampaignSignals(input: {
  campaignKey: string;
  impressions?: number;
  clicks?: number;
  leads?: number;
  spend?: number;
  ctr?: number;
  conversionRate?: number;
  classification?: string;
  source?: string;
}): CampaignPerformanceSignal[] {
  const observedAt = new Date().toISOString();
  const sig: CampaignPerformanceSignal = {
    id: `cmp-${input.campaignKey}-${observedAt}`,
    signalType: "campaign_performance",
    observedAt,
    source: input.source ?? "normalizer.campaign",
    confidence: 0.8,
    explanation: "Normalized ads automation campaign row.",
    metadata: {
      campaignKey: input.campaignKey,
      impressions: input.impressions,
      clicks: input.clicks,
      leads: input.leads,
      spend: input.spend,
      ctr: input.ctr,
      conversionRate: input.conversionRate,
      classification: input.classification,
    },
  };
  return [sig];
}

export function normalizeLeadSignals(input: {
  leadId: string;
  pipelineStage?: string;
  score?: number;
  hoursSinceCreated?: number;
  hoursSinceFollowUp?: number;
  followUpAttempts?: number;
  unlocked?: boolean;
  source?: string;
}): LeadFunnelSignal[] {
  const observedAt = new Date().toISOString();
  const sig: LeadFunnelSignal = {
    id: `ld-${input.leadId}-${observedAt}`,
    signalType: "lead_funnel",
    observedAt,
    source: input.source ?? "normalizer.lead",
    confidence: 0.82,
    explanation: "Normalized CRM lead funnel snapshot.",
    metadata: {
      leadId: input.leadId,
      pipelineStage: input.pipelineStage,
      score: input.score,
      hoursSinceCreated: input.hoursSinceCreated,
      hoursSinceFollowUp: input.hoursSinceFollowUp,
      followUpAttempts: input.followUpAttempts,
      unlocked: input.unlocked,
    },
  };
  return [sig];
}

export function normalizeBookingSignals(input: {
  listingId?: string;
  bookingsStarted?: number;
  bookingsCompleted?: number;
  checkoutAbandonRate?: number;
  source?: string;
}): BookingConversionSignal[] {
  const observedAt = new Date().toISOString();
  const sig: BookingConversionSignal = {
    id: `bkg-${input.listingId ?? "na"}-${observedAt}`,
    signalType: "booking_conversion",
    observedAt,
    source: input.source ?? "normalizer.booking",
    confidence: 0.78,
    explanation: "Normalized BNHub booking funnel snapshot.",
    metadata: {
      listingId: input.listingId,
      bookingsStarted: input.bookingsStarted,
      bookingsCompleted: input.bookingsCompleted,
      checkoutAbandonRate: input.checkoutAbandonRate,
    },
  };
  return [sig];
}

export function normalizeHostBrokerSignals(input: {
  userId?: string;
  hostListingCount?: number;
  lastHostActivityHours?: number;
  brokerLeadTouches?: number;
  source?: string;
}): HostBrokerEngagementSignal[] {
  const observedAt = new Date().toISOString();
  const sig: HostBrokerEngagementSignal = {
    id: `hb-${input.userId ?? "na"}-${observedAt}`,
    signalType: "host_broker_engagement",
    observedAt,
    source: input.source ?? "normalizer.host_broker",
    confidence: 0.75,
    explanation: "Normalized host/broker activity snapshot.",
    metadata: {
      userId: input.userId,
      hostListingCount: input.hostListingCount,
      lastHostActivityHours: input.lastHostActivityHours,
      brokerLeadTouches: input.brokerLeadTouches,
    },
  };
  return [sig];
}

export function aggregateSignalsForTarget(signals: MarketplaceSignal[]): Record<string, number> {
  const agg: Record<string, number> = {};
  for (const s of signals) {
    const m = s.metadata as Record<string, unknown>;
    for (const [k, v] of Object.entries(m)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        agg[k] = (agg[k] ?? 0) + v;
      }
    }
  }
  return agg;
}

export function buildSignalsSummary(signals: MarketplaceSignal[]): Record<string, unknown> {
  return {
    count: signals.length,
    types: [...new Set(signals.map((s) => s.signalType))],
    sources: [...new Set(signals.map((s) => s.source))],
  };
}

/** Safe wrapper — logs and returns empty on bad input */
export function safeNormalize<T extends MarketplaceSignal[]>(fn: () => T, label: string): T {
  try {
    return fn();
  } catch (e) {
    autonomyLog.signals("normalize failed", { label, err: String(e) });
    return [] as unknown as T;
  }
}
