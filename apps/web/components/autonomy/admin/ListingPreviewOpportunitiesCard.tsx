import type { Opportunity } from "@/modules/autonomous-marketplace/types/domain.types";

export function ListingPreviewOpportunitiesCard({ opportunities }: { opportunities: Opportunity[] }) {
  if (!opportunities.length) {
    return (
      <p className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3 text-xs text-zinc-500">
        No opportunities derived from preview signals.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {opportunities.map((o) => (
        <li key={o.id} className="rounded-lg border border-zinc-800 bg-[#111] p-3 text-xs">
          <p className="font-semibold text-zinc-200">{o.title}</p>
          <p className="mt-1 text-zinc-500">{o.explanation}</p>
          <p className="mt-2 font-mono text-[10px] text-zinc-600">risk={o.risk}</p>
        </li>
      ))}
    </ul>
  );
}
