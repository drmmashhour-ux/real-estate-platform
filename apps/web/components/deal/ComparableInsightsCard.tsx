import type { ComparablesBlockDto } from "@/modules/deal-analyzer/domain/contracts";

export function ComparableInsightsCard({ data }: { data: ComparablesBlockDto }) {
  const s = data.summary;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">Comparable band</p>
      <p className="mt-2 text-sm text-slate-300">
        Positioning:{" "}
        <span className="font-semibold text-white">
          {s.positioningOutcome?.replace(/_/g, " ") ?? "—"}
        </span>
        {s.confidenceLevel ? (
          <span className="text-slate-500"> · confidence {s.confidenceLevel}</span>
        ) : null}
      </p>
      {s.priceRangeCents && s.medianPriceCents != null ? (
        <p className="mt-2 text-xs text-slate-500">
          Filtered comparable count: {s.comparableCount ?? data.items.length}. Median list price (platform): $
          {(s.medianPriceCents / 100).toLocaleString()} · range ${(s.priceRangeCents.low / 100).toLocaleString()}–$
          {(s.priceRangeCents.high / 100).toLocaleString()} — not an appraisal.
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          Comparable coverage: {s.comparableCount ?? data.items.length} listings after deterministic filters.
        </p>
      )}
      {s.warnings.slice(0, 2).map((w) => (
        <p key={w} className="mt-2 text-xs text-amber-200/90">
          {w}
        </p>
      ))}
    </div>
  );
}
