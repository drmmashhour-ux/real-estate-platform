"use client";

import type { BNHubHostPerformanceSummary } from "@/modules/bnhub/host-performance/host-performance.types";
import type { BNHubGuestConversionSummary } from "@/modules/bnhub/guest-conversion/guest-conversion.types";
import type { BNHubMissionControlSummary } from "@/modules/bnhub/mission-control/mission-control.types";
import { HostListingPerformanceCard } from "./HostListingPerformanceCard";

export function HostPerformanceDashboard({
  summary,
  showRecommendations,
  guestConversionByListingId,
  conversionLayerByListingId,
  guestConversionShowFriction,
  guestConversionShowRecommendations,
  missionControlByListingId,
  bnhubAutopilot,
}: {
  summary: BNHubHostPerformanceSummary;
  showRecommendations: boolean;
  guestConversionByListingId?: Record<string, BNHubGuestConversionSummary>;
  conversionLayerByListingId?: Record<string, BNHubListingConversionSummaryV1>;
  guestConversionShowFriction?: boolean;
  guestConversionShowRecommendations?: boolean;
  missionControlByListingId?: Record<string, BNHubMissionControlSummary>;
  bnhubAutopilot?: { autopilotV1: boolean; executionV1: boolean; rollbackV1: boolean };
}) {
  return (
    <section className="bnhub-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          📊 Host performance
        </h2>
        <p className="text-[10px] text-neutral-500">
          Advisory only — rankings explain visibility; they do not hide listings or change prices automatically.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Total" value={summary.totalListings} />
        <Stat label="Strong" value={summary.strongListings} accent="text-emerald-300" />
        <Stat label="Healthy" value={summary.healthyListings} accent="text-sky-300" />
        <Stat label="Watch" value={summary.watchListings} accent="text-amber-200" />
        <Stat label="Weak" value={summary.weakListings} accent="text-neutral-400" />
      </div>

      {summary.listings.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">Add a published listing to see performance insights.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {summary.listings.map((row) => (
            <HostListingPerformanceCard
              key={row.listingId}
              row={row}
              showRecommendations={showRecommendations}
              guestConversionSummary={guestConversionByListingId?.[row.listingId] ?? null}
              conversionLayerSummary={conversionLayerByListingId?.[row.listingId] ?? null}
              guestConversionShowFriction={guestConversionShowFriction}
              guestConversionShowRecommendations={guestConversionShowRecommendations}
              missionControlSummary={missionControlByListingId?.[row.listingId] ?? null}
              bnhubAutopilot={bnhubAutopilot}
            />
          ))}
        </div>
      )}

      {!showRecommendations ? (
        <p className="mt-4 text-xs text-neutral-600">
          Detailed suggestions are off (`FEATURE_BNHUB_HOST_RECOMMENDATIONS_V1`). Status and scores still reflect listing
          signals.
        </p>
      ) : null}
    </section>
  );
}

function Stat({
  label,
  value,
  accent = "text-white",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-0.5 text-xl font-semibold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}
