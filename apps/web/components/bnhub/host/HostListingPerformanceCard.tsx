"use client";

import Link from "next/link";
import { GuestConversionPanel } from "@/components/bnhub/guest-conversion/GuestConversionPanel";
import { BNHubAutopilotPanel } from "@/components/bnhub/autopilot/BNHubAutopilotPanel";
import { BNHubMissionControlPanel } from "@/components/bnhub/mission-control/BNHubMissionControlPanel";
import type { BNHubHostListingPerformance } from "@/modules/bnhub/host-performance/host-performance.types";
import type { BNHubGuestConversionSummary } from "@/modules/bnhub/guest-conversion/guest-conversion.types";
import type { BNHubListingConversionSummaryV1 } from "@/modules/bnhub/conversion/bnhub-guest-conversion.types";
import { HostConversionPanel } from "./HostConversionPanel";
import type { BNHubMissionControlSummary } from "@/modules/bnhub/mission-control/mission-control.types";

function statusBadgeClass(status: BNHubHostListingPerformance["performanceStatus"]): string {
  switch (status) {
    case "strong":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "healthy":
      return "border-sky-500/40 bg-sky-500/10 text-sky-100";
    case "watch":
      return "border-amber-500/40 bg-amber-500/10 text-amber-100";
    default:
      return "border-white/15 bg-white/5 text-neutral-300";
  }
}

export function HostListingPerformanceCard({
  row,
  showRecommendations,
  guestConversionSummary,
  conversionLayerSummary,
  guestConversionShowFriction,
  guestConversionShowRecommendations,
  missionControlSummary,
  bnhubAutopilot,
}: {
  row: BNHubHostListingPerformance;
  showRecommendations: boolean;
  guestConversionSummary?: BNHubGuestConversionSummary | null;
  conversionLayerSummary?: BNHubListingConversionSummaryV1 | null;
  guestConversionShowFriction?: boolean;
  guestConversionShowRecommendations?: boolean;
  missionControlSummary?: BNHubMissionControlSummary | null;
  bnhubAutopilot?: { autopilotV1: boolean; executionV1: boolean; rollbackV1: boolean };
}) {
  const topRecs = showRecommendations ? row.recommendations.slice(0, 3) : [];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-white">{row.listingTitle ?? "Listing"}</p>
          <p className="font-mono text-[10px] text-neutral-500">{row.listingId.slice(0, 8)}…</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {row.rankingScore != null ? (
            <span className="rounded-full border border-premium-gold/30 bg-premium-gold/10 px-2 py-0.5 text-xs text-premium-gold">
              Score {row.rankingScore.toFixed(0)}
            </span>
          ) : (
            <span className="text-xs text-neutral-500">Score n/a</span>
          )}
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(row.performanceStatus)}`}
          >
            {row.performanceStatus}
          </span>
        </div>
      </div>

      {row.strongSignals.length > 0 ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500/90">Strong signals</p>
          <ul className="mt-1 list-inside list-disc text-xs text-neutral-400">
            {row.strongSignals.slice(0, 3).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {row.weakSignals.length > 0 ? (
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-500/90">Watch</p>
          <ul className="mt-1 list-inside list-disc text-xs text-neutral-400">
            {row.weakSignals.slice(0, 3).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {topRecs.length > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Suggestions</p>
          <ul className="mt-2 space-y-2">
            {topRecs.map((rec) => (
              <li key={rec.id} className="text-xs text-neutral-300">
                <span className="font-medium text-white">{rec.title}</span>
                <span className="text-neutral-500"> — {rec.impact} impact</span>
                <p className="mt-0.5 text-[11px] text-neutral-500">{rec.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {missionControlSummary ? <BNHubMissionControlPanel summary={missionControlSummary} /> : null}

      {guestConversionSummary ? (
        <GuestConversionPanel
          summary={guestConversionSummary}
          showFriction={Boolean(guestConversionShowFriction)}
          showRecommendations={Boolean(guestConversionShowRecommendations)}
        />
      ) : null}

      {conversionLayerSummary ? <HostConversionPanel summary={conversionLayerSummary} /> : null}

      {bnhubAutopilot?.autopilotV1 ? (
        <BNHubAutopilotPanel
          listingId={row.listingId}
          autopilotV1={bnhubAutopilot.autopilotV1}
          executionV1={bnhubAutopilot.executionV1}
          rollbackV1={bnhubAutopilot.rollbackV1}
        />
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/bnhub/host/listings/${row.listingId}/edit`}
          className="text-xs font-medium text-premium-gold hover:underline"
        >
          Edit listing
        </Link>
        <Link
          href={`/bnhub/host/listings/${row.listingId}/setup`}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Setup
        </Link>
      </div>
    </div>
  );
}
