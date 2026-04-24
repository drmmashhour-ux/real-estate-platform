"use client";

import type { UserJourneyView } from "@/modules/user-intelligence/services/user-journey.service";

type Props = { journey: UserJourneyView | null; loading?: boolean };

export function UserJourneySummary({ journey, loading }: Props) {
  if (loading) {
    return <p className="text-slate-400">Loading journey state…</p>;
  }
  if (!journey) {
    return <p className="text-slate-400">No journey state yet — it updates as you use LECIPM (search, Dream Home, and related flows).</p>;
  }
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
      <p>
        <span className="text-slate-500">Domain: </span>
        {journey.currentDomain ?? "—"}
      </p>
      <p>
        <span className="text-slate-500">Stage: </span>
        {journey.currentStage ?? "—"}
      </p>
      <p>
        <span className="text-slate-500">Latest city: </span>
        {journey.latestCity ?? "—"}
      </p>
      <p>
        <span className="text-slate-500">Recency: </span>
        {(journey.recency * 100).toFixed(0)}% · <span className="text-slate-500">Intent weight: </span>
        {(journey.intentWeight * 100).toFixed(0)}%
      </p>
    </div>
  );
}
