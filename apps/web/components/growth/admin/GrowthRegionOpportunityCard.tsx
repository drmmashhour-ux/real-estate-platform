import type { GrowthRegionOpportunitySummary } from "@/modules/growth-intelligence/growth.types";

export function GrowthRegionOpportunityCard(props: { rows: GrowthRegionOpportunitySummary[] }) {
  if (!props.rows.length) {
    return <p className="text-sm text-zinc-500">No regional clusters flagged.</p>;
  }
  return (
    <ul className="space-y-2 text-xs text-zinc-300">
      {props.rows.slice(0, 12).map((r) => (
        <li key={r.regionKey} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
          <span className="font-medium text-white">{r.regionKey}</span> · {r.opportunityCount} opps ·{" "}
          <span className="text-zinc-500">{r.highestSeverity ?? "—"}</span>
          <p className="mt-1 text-[11px] text-zinc-500">{r.summary}</p>
        </li>
      ))}
    </ul>
  );
}
