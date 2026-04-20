import type { GlobalTrustSummary } from "@/modules/global-intelligence/global-intelligence.types";

export function GlobalTrustComparisonCard({ summary }: { summary: GlobalTrustSummary }) {
  return (
    <div className="rounded-xl border border-amber-900/30 bg-black p-4 text-sm text-zinc-200">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500">Trust availability</p>
      <ul className="mt-3 space-y-2">
        {summary.regions.map((r) => (
          <li key={r.regionCode} className="flex justify-between border-b border-zinc-900 pb-2">
            <span>{r.regionCode}</span>
            <span className={r.trustAvailability ? "text-emerald-400" : "text-zinc-500"}>
              {r.trustAvailability ? "signals on" : "limited"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-zinc-600">{summary.freshness}</p>
    </div>
  );
}
