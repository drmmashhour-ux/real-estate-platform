import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getHostPricingOverview } from "@/lib/host/getHostPricingOverview";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

export default async function HostSmartPricingPage() {
  const hostId = await getGuestId();
  if (!hostId) return null;

  const overview = await getHostPricingOverview(hostId);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Smart pricing</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Suggested by AI — review before applying. Uses demand, occupancy, and your autopilot guardrails.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <p className="text-xs uppercase text-zinc-500">Avg nightly (current)</p>
          <p className="mt-2 text-2xl font-bold text-white">${overview.averageCurrentNightly.toFixed(0)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <p className="text-xs uppercase text-zinc-500">Suggested average</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: GOLD }}>
            ${overview.averageSuggestedNightly.toFixed(0)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <p className="text-xs uppercase text-zinc-500">Occupancy (heuristic)</p>
          <p className="mt-2 text-2xl font-bold text-white">{overview.occupancyRatePercent}%</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <p className="text-xs uppercase text-zinc-500">Avg demand score</p>
          <p className="mt-2 text-2xl font-bold text-white">{(overview.demandScoreAvg * 100).toFixed(0)}%</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Listing-by-listing</h2>
          <p className="text-xs text-zinc-500">Apply updates from each listing&apos;s edit flow or run evaluation from Autopilot.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-black/40 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Current</th>
                <th className="px-4 py-3">Suggested</th>
                <th className="px-4 py-3">Delta</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {overview.listings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    Publish a listing to see pricing signals.
                  </td>
                </tr>
              ) : (
                overview.listings.map((row) => (
                  <tr key={row.listingId} className="border-b border-zinc-800/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{row.title}</p>
                      <p className="text-xs text-zinc-500">{row.city}</p>
                    </td>
                    <td className="px-4 py-3">${row.currentNightly.toFixed(0)}</td>
                    <td className="px-4 py-3" style={{ color: GOLD }}>
                      ${row.suggestedNightly.toFixed(0)}
                    </td>
                    <td className="px-4 py-3">{row.deltaPct >= 0 ? "+" : ""}
                      {row.deltaPct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {row.confidence >= 0.7 ? "High" : row.confidence >= 0.45 ? "Medium" : "Low"}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-zinc-400">{row.reason}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/bnhub/host/listings/${row.listingId}/edit`}
                        className="text-xs font-medium hover:underline"
                        style={{ color: GOLD }}
                      >
                        Review details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Recent pricing snapshots</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          {overview.snapshots.length === 0 ? (
            <li className="rounded-xl border border-zinc-800 bg-[#111] px-4 py-6 text-center text-zinc-500">
              No snapshots yet — run{" "}
              <Link href="/host/autopilot" className="underline" style={{ color: GOLD }}>
                autopilot evaluation
              </Link>{" "}
              or `pnpm ai:autopilot`.
            </li>
          ) : (
            overview.snapshots.map((s) => (
              <li key={`${s.listingId}-${s.capturedAt.toISOString()}`} className="flex flex-wrap justify-between gap-2 rounded-xl border border-zinc-800 bg-[#111] px-4 py-2">
                <span className="font-mono text-xs text-zinc-500">{s.listingId.slice(0, 8)}…</span>
                <span>{s.capturedAt.toISOString().slice(0, 16)}</span>
                <span>
                  base ${s.basePrice.toFixed(0)} → suggested {s.suggestedPrice != null ? `$${s.suggestedPrice.toFixed(0)}` : "—"}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
