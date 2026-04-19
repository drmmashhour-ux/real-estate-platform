import type { GrowthActionSuggestionBundle } from "@/modules/growth/flywheel-success-suggestions.types";

export function MarketplaceFlywheelAutoSuggestPanel({
  bundle,
}: {
  bundle: GrowthActionSuggestionBundle;
}) {
  return (
    <section className="rounded-2xl border border-emerald-500/25 bg-zinc-950/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
            Growth (advisory)
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Suggested flywheel actions</h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Internal triage order from current marketplace flags and past scored operator evaluations.
            Not causal proof; not predictive. Operators create tracked actions explicitly — nothing here runs or spends
            automatically.
          </p>
        </div>
        <p className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-zinc-500">
          Generated {new Date(bundle.generatedAt).toLocaleString()}
        </p>
      </div>

      {bundle.warnings.length > 0 ? (
        <ul className="mt-3 list-inside list-disc text-xs text-amber-200/90">
          {bundle.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      <ol className="mt-4 space-y-4">
        {bundle.suggestions.map((s, i) => (
          <li
            key={s.id}
            className="rounded-xl border border-white/10 bg-black/30 p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-white">
                {i + 1}. {s.title}
              </p>
              <span className="rounded-full border border-emerald-500/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-200/90">
                {s.ownerArea.replace(/_/g, " ")}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">{s.description}</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-300">{s.rationale}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-zinc-500">
              <span>
                Past scored evaluations tagged positive (share):{" "}
                <span className="tabular-nums text-zinc-300">
                  {s.successRate == null ? "—" : `${Math.round(s.successRate * 100)}%`}
                </span>
                <span className="text-zinc-600"> — not a forecast</span>
              </span>
              <span className="capitalize">Sample strength label: {s.confidenceLevel}</span>
              {s.recommendedNow ? (
                <span className="text-emerald-400/90">Review sooner (rank heuristic only)</span>
              ) : (
                <span className="text-zinc-600">Background watchlist</span>
              )}
            </div>
            <ul className="mt-2 list-inside list-disc text-[11px] text-zinc-500">
              {s.constraints.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
