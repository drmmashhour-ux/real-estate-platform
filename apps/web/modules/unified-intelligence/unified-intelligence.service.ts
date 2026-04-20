/**
 * Listing-level unified intelligence — routes Syria through regional adapter only (read-only).
 */
import { prisma } from "@/lib/db";
import { engineFlags, eventTimelineFlags } from "@/config/feature-flags";
import { getRegionDefinition } from "@lecipm/platform-core";
import { getJurisdictionPolicyPack } from "@/modules/legal/jurisdiction/jurisdiction-policy-pack-registry";
import {
  buildRegionListingKey,
  buildRegionListingRef,
  DEFAULT_WEB_REGION_CODE,
  parseRegionListingKey,
} from "@/modules/integrations/regions/region-listing-key.service";
import type { RegionListingSource } from "@/modules/integrations/regions/region-listing-key.types";
import {
  getBookingStats,
  getListingById as syriaGetListingBundle,
  SYRIA_REGION_CODE,
} from "@/modules/integrations/regions/syria/syria-region-adapter.service";
import { getSyriaCapabilityNotes } from "@/modules/integrations/regions/syria/syria-region-capabilities.service";
import type {
  ListingSourceAvailability,
  UnifiedEntityIntelligence,
  UnifiedEntityType,
  UnifiedIntelligenceSourceStatus,
  UnifiedIntelligenceSummary,
  UnifiedListingIntelligence,
  UnifiedListingReadModel,
  UnifiedListingSource,
} from "./unified-intelligence.types";
import { getCanonicalRunsForListingTarget, listUnifiedRecentListingIds } from "./unified-intelligence.repository";
import { buildEntityTimeline } from "@/modules/events/event-timeline.service";

export type GetUnifiedListingIntelligenceParams = {
  listingId?: string;
  /** Wire-format key `{regionCode}:{source}:{listingId}` — parsed when `FEATURE_REGION_LISTING_KEY_V1` is on. */
  regionListingKey?: string;
  /** When omitted, resolves web CRM `Listing` row only — Syria requires explicit `syria`. */
  source?: UnifiedListingSource;
  regionCode?: string;
};

function emptyBookingCounts(): UnifiedListingIntelligence["bookingCounts"] {
  return {
    total: 0,
    fraudBookings: 0,
    guestPaid: 0,
    payoutPending: 0,
    payoutPaid: 0,
    cancelled: 0,
  };
}

function norm(s: string | undefined): string {
  return typeof s === "string" ? s.trim() : "";
}

function resolveRegionListingRef(params: {
  listingId: string;
  source: UnifiedListingSource;
  regionCode?: string;
}): UnifiedListingIntelligence["regionListingRef"] {
  if (!engineFlags.regionListingKeyV1 || !params.listingId) return null;
  const rc =
    params.regionCode ??
    (params.source === "syria"
      ? SYRIA_REGION_CODE
      : params.source === "web"
        ? DEFAULT_WEB_REGION_CODE
        : norm(params.regionCode) || "ext");
  const key = buildRegionListingKey({
    regionCode: rc,
    source: params.source as RegionListingSource,
    listingId: params.listingId,
  });
  return buildRegionListingRef(key);
}

function finalize(
  intel: Omit<UnifiedListingIntelligence, "regionListingRef">,
  refParams: { listingId: string; source: UnifiedListingSource; regionCode?: string },
): UnifiedListingIntelligence {
  const cap = intel.source === "syria" ? [...getSyriaCapabilityNotes()] : [];
  const availabilityNotes = [...intel.availabilityNotes];
  for (const n of cap) {
    if (!availabilityNotes.includes(n)) availabilityNotes.push(n);
  }

  const rc =
    intel.regionCode ??
    refParams.regionCode ??
    (intel.source === "syria" ? SYRIA_REGION_CODE : DEFAULT_WEB_REGION_CODE);
  const regDef = getRegionDefinition(rc);
  const pack = getJurisdictionPolicyPack(rc);

  return {
    ...intel,
    sourceApp: intel.source,
    regionCapabilities: regDef ? { ...regDef.capabilities } : undefined,
    jurisdictionNotes: [...pack.notes],
    availabilityNotes,
    regionListingRef: resolveRegionListingRef(refParams),
  };
}

export async function getUnifiedListingIntelligence(
  params: GetUnifiedListingIntelligenceParams,
): Promise<UnifiedListingIntelligence> {
  let listingId = norm(params.listingId);
  let source: UnifiedListingSource = params.source ?? "web";
  let explicitRegionCode = params.regionCode;

  const notes: string[] = [];

  if (engineFlags.regionListingKeyV1 && params.regionListingKey) {
    const parsed = parseRegionListingKey(params.regionListingKey);
    if (parsed.key) {
      listingId = parsed.key.listingId;
      source = parsed.key.source as UnifiedListingSource;
      explicitRegionCode = parsed.key.regionCode;
    } else if (parsed.fallbackNote) {
      notes.push(parsed.fallbackNote);
    }
  }

  if (!listingId) {
    return finalize(
      {
        listingId: "",
        source,
        priceHint: null,
        currencyHint: null,
        statusHint: null,
        fraudFlag: false,
        featuredHint: false,
        bookingCounts: emptyBookingCounts(),
        payoutPipeline: { pendingHint: 0, paidHint: 0, approvedHint: 0, notes: ["listing_id_missing"] },
        syriaRegionSummaryAttached: false,
        sourceStatus: { web: "missing", syria: "missing" },
        availabilityNotes: [...notes, "listing_id_missing"],
      },
      { listingId: "", source, regionCode: explicitRegionCode },
    );
  }

  if (source === "syria") {
    if (!engineFlags.syriaRegionAdapterV1) {
      return finalize(
        {
          listingId,
          source: "syria",
          regionCode: SYRIA_REGION_CODE,
          priceHint: null,
          currencyHint: null,
          statusHint: null,
          fraudFlag: false,
          featuredHint: false,
          bookingCounts: emptyBookingCounts(),
          payoutPipeline: { pendingHint: 0, paidHint: 0, approvedHint: 0, notes: [] },
          syriaRegionSummaryAttached: false,
          sourceStatus: { syria: "missing" },
          availabilityNotes: [...notes, "syria_region_adapter_disabled"],
        },
        { listingId, source: "syria", regionCode: SYRIA_REGION_CODE },
      );
    }

    const { listing, availabilityNotes } = await syriaGetListingBundle(listingId);
    const statsRes = await getBookingStats(listingId);
    const s = statsRes.data;
    const bc = s
      ? {
          total: s.bookingCount,
          fraudBookings: s.bookingsWithFraudFlag,
          guestPaid: s.guestPaidCount,
          payoutPending: s.payoutPendingCount,
          payoutPaid: s.payoutPaidCount,
          cancelled: s.cancelledCount,
        }
      : emptyBookingCounts();

    if (!listing) {
      return finalize(
        {
          listingId,
          source: "syria",
          regionCode: SYRIA_REGION_CODE,
          priceHint: null,
          currencyHint: null,
          statusHint: null,
          fraudFlag: false,
          featuredHint: false,
          bookingCounts: bc,
          payoutPipeline: {
            pendingHint: s?.payoutPendingCount ?? 0,
            paidHint: s?.payoutPaidCount ?? 0,
            approvedHint: 0,
            notes: [],
          },
          syriaRegionSummaryAttached: false,
          sourceStatus: { syria: "missing" },
          availabilityNotes: [...notes, ...availabilityNotes, ...statsRes.availabilityNotes],
        },
        { listingId, source: "syria", regionCode: SYRIA_REGION_CODE },
      );
    }

    return finalize(
      {
        listingId,
        source: "syria",
        regionCode: SYRIA_REGION_CODE,
        priceHint: listing.price,
        currencyHint: listing.currency,
        statusHint: listing.status,
        fraudFlag: listing.fraudFlag,
        featuredHint: listing.isFeatured,
        bookingCounts: bc,
        payoutPipeline: {
          pendingHint: s?.payoutPendingCount ?? 0,
          paidHint: s?.payoutPaidCount ?? 0,
          approvedHint: 0,
          notes: s ? [] : ["syria_booking_stats_unavailable"],
        },
        syriaRegionSummaryAttached: false,
        sourceStatus: { syria: "available" },
        availabilityNotes: [...notes, ...availabilityNotes, ...statsRes.availabilityNotes],
      },
      { listingId, source: "syria", regionCode: SYRIA_REGION_CODE },
    );
  }

  if (source === "external") {
    return finalize(
      {
        listingId,
        source: "external",
        regionCode: explicitRegionCode,
        priceHint: null,
        currencyHint: null,
        statusHint: null,
        fraudFlag: false,
        featuredHint: false,
        bookingCounts: emptyBookingCounts(),
        payoutPipeline: { pendingHint: 0, paidHint: 0, approvedHint: 0, notes: ["external_source_not_resolved"] },
        syriaRegionSummaryAttached: false,
        sourceStatus: {},
        availabilityNotes: [...notes, "external_listing_intel_not_configured"],
      },
      { listingId, source: "external", regionCode: explicitRegionCode },
    );
  }

  /** Default web CRM listing — minimal read-only projection (no Québec legal binding). */
  try {
    const row = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        price: true,
        title: true,
        listingCode: true,
        commissionCategory: true,
        updatedAt: true,
      },
    });
    if (!row) {
      notes.push("web_listing_not_found");

      let syHint = { listing: null as null, availabilityNotes: [] as string[] };
      if (engineFlags.syriaRegionAdapterV1) {
        syHint = await syriaGetListingBundle(listingId);
      }

      let syriaAvail: ListingSourceAvailability = "missing";
      if (engineFlags.syriaRegionAdapterV1 && syHint.listing) syriaAvail = "available";

      const amb: string[] = [];
      if (syHint.listing) {
        amb.push("same_id_exists_in_syria_namespace_use_explicit_source_syria_or_region_listing_key");
      }
      if (engineFlags.regionListingKeyV1 && syHint.listing) {
        amb.push("plain_listing_id_ambiguous_across_regions");
      }

      return finalize(
        {
          listingId,
          source: "web",
          regionCode: explicitRegionCode ?? DEFAULT_WEB_REGION_CODE,
          priceHint: null,
          currencyHint: null,
          statusHint: null,
          fraudFlag: false,
          featuredHint: false,
          bookingCounts: emptyBookingCounts(),
          payoutPipeline: { pendingHint: 0, paidHint: 0, approvedHint: 0, notes: [] },
          syriaRegionSummaryAttached: false,
          sourceStatus: {
            web: "missing",
            ...(engineFlags.syriaRegionAdapterV1 ? { syria: syriaAvail } : {}),
          },
          availabilityNotes: [
            ...notes,
            ...amb,
            ...(engineFlags.syriaRegionAdapterV1 ? syHint.availabilityNotes : []),
          ],
        },
        { listingId, source: "web", regionCode: explicitRegionCode ?? DEFAULT_WEB_REGION_CODE },
      );
    }

    const collisionNotes: string[] = [];
    if (engineFlags.syriaRegionAdapterV1 && engineFlags.regionListingKeyV1) {
      const syOnly = await syriaGetListingBundle(listingId);
      if (syOnly.listing) {
        collisionNotes.push("listing_id_collision_web_crm_and_syria_resolve_with_region_listing_key");
      }
    }

    return finalize(
      {
        listingId: row.id,
        source: "web",
        regionCode: explicitRegionCode ?? DEFAULT_WEB_REGION_CODE,
        priceHint: typeof row.price === "number" ? row.price : null,
        currencyHint: "CAD",
        statusHint: row.commissionCategory,
        fraudFlag: false,
        featuredHint: false,
        bookingCounts: emptyBookingCounts(),
        payoutPipeline: {
          pendingHint: 0,
          paidHint: 0,
          approvedHint: 0,
          notes: ["web_booking_agg_not_attached_to_crm_listing"],
        },
        syriaRegionSummaryAttached: false,
        sourceStatus: { web: "available" },
        availabilityNotes: [...notes, ...collisionNotes, "crm_listing_minimal_intel_only"],
      },
      { listingId: row.id, source: "web", regionCode: explicitRegionCode ?? DEFAULT_WEB_REGION_CODE },
    );
  } catch {
    return finalize(
      {
        listingId,
        source: "web",
        regionCode: explicitRegionCode ?? DEFAULT_WEB_REGION_CODE,
        priceHint: null,
        currencyHint: null,
        statusHint: null,
        fraudFlag: false,
        featuredHint: false,
        bookingCounts: emptyBookingCounts(),
        payoutPipeline: { pendingHint: 0, paidHint: 0, approvedHint: 0, notes: ["web_read_failed"] },
        syriaRegionSummaryAttached: false,
        sourceStatus: { web: "missing" },
        availabilityNotes: [...notes, "web_listing_read_failed"],
      },
      { listingId, source: "web", regionCode: explicitRegionCode ?? DEFAULT_WEB_REGION_CODE },
    );
  }
}

function emptySourceStatus(partial?: Partial<UnifiedIntelligenceSourceStatus>): UnifiedIntelligenceSourceStatus {
  return {
    canonicalRuns: partial?.canonicalRuns ?? "missing",
    eventTimeline: partial?.eventTimeline ?? "missing",
    legalTrust: partial?.legalTrust ?? "partial",
    notes: partial?.notes ?? [],
  };
}

function dedupeNotes(notes: string[]): string[] {
  return [...new Set(notes)];
}

/** Validates optional `source` query param for admin unified-intelligence APIs. */
export function parseOptionalListingSource(raw: string | null): UnifiedListingSource | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "web" || v === "syria" || v === "external") return v;
  return undefined;
}

/** Spec-style alias for `getUnifiedListingIntelligence` — single listing id first. */
export async function buildUnifiedListingIntelligence(
  listingId: string,
  opts?: Omit<GetUnifiedListingIntelligenceParams, "listingId">,
): Promise<UnifiedListingIntelligence> {
  return getUnifiedListingIntelligence({ listingId, ...opts });
}

/**
 * Canonical unified listing read model — merges CRM/regional signals, autonomy runs, and (when enabled) event timeline counts.
 * Read-only; never triggers execution or preview writes.
 */
export async function buildUnifiedListingReadModel(
  params: GetUnifiedListingIntelligenceParams,
): Promise<UnifiedListingReadModel> {
  const freshness = new Date().toISOString();
  const intel = await getUnifiedListingIntelligence(params);
  const canonical = await getCanonicalRunsForListingTarget(intel.listingId);

  let eventTimelineStatus: UnifiedIntelligenceSourceStatus["eventTimeline"] = "missing";
  const timelineNotes: string[] = [];
  let eventSummary: { eventCount: number; byType: Record<string, number> } | null = null;

  if (intel.listingId && eventTimelineFlags.eventTimelineV1) {
    try {
      const tl = await buildEntityTimeline("listing", intel.listingId);
      eventSummary = { eventCount: tl.events.length, byType: tl.byType };
      if (tl.events.length > 0) {
        eventTimelineStatus = "available";
      } else {
        eventTimelineStatus = "partial";
        timelineNotes.push("event_timeline_empty");
      }
    } catch {
      eventTimelineStatus = "partial";
      timelineNotes.push("event_timeline_query_failed");
    }
  } else if (intel.listingId) {
    timelineNotes.push("event_timeline_feature_off");
  }

  const canonicalRunsStatus: UnifiedIntelligenceSourceStatus["canonicalRuns"] =
    canonical.runs.length > 0 ? "available" : canonical.notes.length > 0 ? "partial" : "missing";

  const legalTrustStatus: UnifiedIntelligenceSourceStatus["legalTrust"] =
    (intel.jurisdictionNotes?.length ?? 0) > 0 ? "available" : "partial";

  const observation: Record<string, unknown> = {
    regionCode: intel.regionCode ?? null,
    regionListingRef: intel.regionListingRef,
    priceHint: intel.priceHint,
    currencyHint: intel.currencyHint,
    statusHint: intel.statusHint,
    featuredHint: intel.featuredHint,
    regionCapabilities: intel.regionCapabilities ?? null,
    jurisdictionNotes: [...(intel.jurisdictionNotes ?? [])],
  };

  const trust: Record<string, unknown> = {
    fraudFlag: intel.fraudFlag,
    bookingCounts: intel.bookingCounts,
    payoutPipeline: intel.payoutPipeline,
    sourceStatus: intel.sourceStatus,
  };

  const growth: Record<string, unknown> = {
    syriaRegionSummaryAttached: intel.syriaRegionSummaryAttached,
  };

  const execution: Record<string, unknown> = {
    recentRuns: canonical.runs.map((r) => ({
      runId: r.id,
      createdAt: r.createdAt.toISOString(),
      dryRun: r.dryRun,
      status: r.status,
      autonomyMode: r.autonomyMode,
      actionSummaries: r.actions,
    })),
    repositoryNotes: canonical.notes,
  };

  const governance: Record<string, unknown> = {
    actionGovernanceHints: canonical.runs.flatMap((r) =>
      r.actions.map((a) => ({
        runId: r.id,
        actionType: a.actionType,
        governanceDisposition: a.governanceDisposition,
        executionStatus: a.executionStatus,
      })),
    ),
  };

  const auditSummary: Record<string, unknown> = {
    canonicalRunCount: canonical.runs.length,
    eventTimelineEventCount: eventSummary?.eventCount ?? null,
    hint: "canonical_autonomous_marketplace_runs_primary_source",
  };

  const preview: Record<string, unknown> | undefined = engineFlags.autonomyExplainabilityV1
    ? {
        note: "explainability_available_admin_preview_endpoints_are_read_only_dry_run",
        listingId: intel.listingId,
      }
    : undefined;

  const compliance: Record<string, unknown> | undefined =
    intel.jurisdictionNotes && intel.jurisdictionNotes.length > 0
      ? { packNotes: [...intel.jurisdictionNotes] }
      : undefined;

  const legalRisk: Record<string, unknown> = {
    advisoryOnly: true,
    resolutionPath: intel.source === "web" ? "crm_row_minimal" : "region_adapter",
  };

  const ranking: Record<string, unknown> = {
    advisoryOnly: true,
    legalTrustRankingV1Enabled: engineFlags.legalTrustRankingV1,
    note: "deterministic_ranking_follows_trust_and_legal_services",
  };

  const sourceStatus: UnifiedIntelligenceSourceStatus = emptySourceStatus({
    canonicalRuns: canonicalRunsStatus,
    eventTimeline: eventTimelineStatus,
    legalTrust: legalTrustStatus,
    notes: dedupeNotes([...canonical.notes, ...timelineNotes]),
  });

  const availabilityNotes = dedupeNotes([...intel.availabilityNotes, ...canonical.notes, ...timelineNotes]);

  return {
    listingId: intel.listingId,
    source: intel.source,
    observation,
    preview,
    compliance,
    legalRisk,
    trust,
    ranking,
    growth,
    governance,
    execution,
    auditSummary,
    freshness,
    availabilityNotes,
    sourceStatus,
  };
}

export async function buildUnifiedIntelligenceSummary(): Promise<UnifiedIntelligenceSummary> {
  const recent = await listUnifiedRecentListingIds(30);
  let canonicalRunCountHint = 0;
  try {
    if (engineFlags.autonomousMarketplaceV1) {
      canonicalRunCountHint = await prisma.autonomousMarketplaceRun.count();
    }
  } catch {
    canonicalRunCountHint = 0;
  }

  return {
    freshness: new Date().toISOString(),
    recentListingIds: recent.ids,
    canonicalRunCountHint,
    flags: {
      autonomousMarketplace: engineFlags.autonomousMarketplaceV1 === true,
      controlledExecution: engineFlags.controlledExecutionV1 === true,
      unifiedReadModel: engineFlags.unifiedIntelligenceV1 === true,
    },
    availabilityNotes: dedupeNotes([...recent.notes]),
  };
}

export async function buildUnifiedEntityIntelligence(params: {
  entityType: UnifiedEntityType;
  entityId: string;
  listingParams?: Pick<GetUnifiedListingIntelligenceParams, "source" | "regionListingKey" | "regionCode">;
}): Promise<UnifiedEntityIntelligence> {
  const freshness = new Date().toISOString();
  if (params.entityType === "listing") {
    const model = await buildUnifiedListingReadModel({
      listingId: params.entityId,
      ...params.listingParams,
    });
    return {
      entityType: "listing",
      entityId: params.entityId,
      facets: { listing: model as unknown as Record<string, unknown> },
      freshness,
      availabilityNotes: model.availabilityNotes,
      sourceStatus: model.sourceStatus,
    };
  }

  return {
    entityType: params.entityType,
    entityId: params.entityId,
    facets: {},
    freshness,
    availabilityNotes: ["entity_type_not_in_unified_read_model_v1"],
    sourceStatus: emptySourceStatus({
      canonicalRuns: "missing",
      eventTimeline: "missing",
      legalTrust: "missing",
      notes: ["unsupported_entity_kind"],
    }),
  };
}

