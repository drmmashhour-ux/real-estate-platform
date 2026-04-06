import Link from "next/link";
import type { ListingConversionInsight } from "@/lib/ai/conversion/conversion-types";

export function HostConversionInsights({ insights }: { insights: ListingConversionInsight[] }) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-sky-500/25 bg-sky-950/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-sky-400/90">Conversion insights</p>
          <p className="mt-1 text-sm text-slate-400">
            Based on real views, booking outcomes, and messages from the last 30 days — no artificial urgency or demand
            estimates.
          </p>
        </div>
        <Link
          href="/bnhub/host/dashboard"
          className="shrink-0 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
        >
          BNHub listing tools
        </Link>
      </div>

      <ul className="mt-4 space-y-4">
        {insights.map((row) => (
          <li
            key={row.listingId}
            className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 text-sm text-slate-300"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium text-white">{row.title}</p>
              {row.metrics.lowConversion ? (
                <span className="rounded-full border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-xs text-amber-200">
                  Low conversion vs traffic
                </span>
              ) : (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2 py-0.5 text-xs text-emerald-200">
                  Within expected range
                </span>
              )}
            </div>

            <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Recorded views (window)</dt>
                <dd className="tabular-nums text-slate-200">{row.metrics.listingViews}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Completed bookings ÷ views</dt>
                <dd className="tabular-nums text-slate-200">
                  {row.metrics.conversionRate === null
                    ? "—"
                    : `${(row.metrics.conversionRate * 100).toFixed(2)}%`}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Booking starts ÷ views</dt>
                <dd className="tabular-nums text-slate-200">
                  {row.metrics.bookingStartRate === null
                    ? "—"
                    : `${(row.metrics.bookingStartRate * 100).toFixed(2)}%`}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Abandonment (abandoned ÷ starts)</dt>
                <dd className="tabular-nums text-slate-200">
                  {row.metrics.abandonmentRate === null
                    ? "—"
                    : `${(row.metrics.abandonmentRate * 100).toFixed(1)}%`}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-xs leading-relaxed text-slate-500">{row.metrics.explanation}</p>

            {row.decisionSuppressed ? (
              <p className="mt-2 text-xs text-slate-500">
                Suggestions were suppressed by the decision engine to avoid repetitive low-value prompts:{" "}
                {row.decisionSuppressionReason ?? "suppressed"}
              </p>
            ) : null}

            {row.trustRankingBoostApplied ? (
              <p className="mt-2 text-xs text-emerald-400/90">{row.trustRankingBoostNote}</p>
            ) : null}

            {row.recommendations.length > 0 ? (
              <ul className="mt-3 space-y-2 border-t border-slate-800/80 pt-3">
                {row.recommendations.map((rec) => (
                  <li key={`${rec.listingId}-${rec.type}`} className="rounded-lg bg-slate-900/40 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-100">{rec.summary}</p>
                      <span className="text-[10px] uppercase tracking-wide text-slate-500">{rec.priority}</span>
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-500">
                      {rec.reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                    {rec.type === "pricing_review" ? (
                      <p className="mt-2 text-xs">
                        <Link
                          href={`/bnhub/host/listings/${row.listingId}/edit`}
                          className="text-sky-400 hover:text-sky-300"
                        >
                          Open listing editor (pricing & rules)
                        </Link>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
