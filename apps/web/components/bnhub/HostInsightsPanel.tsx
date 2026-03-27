import { getHostInsights } from "@/lib/bnhub/host-insights";

export async function HostInsightsPanel({ ownerId }: { ownerId: string }) {
  const data = await getHostInsights(ownerId);
  if (data.cities.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-400">
        Add a published listing to see market averages and booking trends.
      </div>
    );
  }

  const avg =
    data.avgPriceInAreaCents != null ? `$${(data.avgPriceInAreaCents / 100).toFixed(0)}` : "—";
  const suggested =
    data.suggestedPriceCents != null ? `$${(data.suggestedPriceCents / 100).toFixed(0)}` : "—";

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/15 p-5">
      <h2 className="text-lg font-semibold text-white">Host insights</h2>
      <p className="mt-1 text-sm text-slate-400">
        Market context in {data.cities.slice(0, 3).join(", ")}
        {data.cities.length > 3 ? "…" : ""}
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Avg price (area)</dt>
          <dd className="mt-1 text-xl font-semibold text-emerald-300">{avg}</dd>
          <dd className="mt-1 text-xs text-slate-500">Published peers in your primary city</dd>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Suggested nightly</dt>
          <dd className="mt-1 text-xl font-semibold text-indigo-300">{suggested}</dd>
          <dd className="mt-1 text-xs text-slate-500">Smart pricing model for your listing</dd>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:col-span-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Booking trend</dt>
          <dd className="mt-2 max-h-28 overflow-y-auto text-sm text-slate-300">
            {data.bookingTrend.length === 0 ? (
              <span className="text-slate-500">No bookings in the last 6 months.</span>
            ) : (
              <ul className="space-y-1">
                {data.bookingTrend.map((row) => (
                  <li key={row.month} className="flex justify-between gap-2">
                    <span className="text-slate-400">{row.month}</span>
                    <span>{row.count} new</span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
