import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getHostPricingOverview } from "@/lib/host/getHostPricingOverview";
import { prisma } from "@repo/db";
import { HostBnhubPricingSuggestionsPanel } from "@/components/host/HostBnhubPricingSuggestionsPanel";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

export default async function HostSmartPricingPage() {
  const hostId = await getGuestId();
  if (!hostId) return null;

  const overview = await getHostPricingOverview(hostId);

  const [dailySuggestions, executionLogs, listingModes] = await Promise.all([
    prisma.bnhubPricingSuggestion.findMany({
      where: { listing: { ownerId: hostId } },
      orderBy: { date: "asc" },
      take: 120,
      include: { listing: { select: { title: true, currency: true } } },
    }),
    prisma.bnhubPricingExecutionLog.findMany({
      where: { listing: { ownerId: hostId } },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { listing: { select: { title: true } } },
    }),
    prisma.shortTermListing.findMany({
      where: { ownerId: hostId },
      select: {
        id: true,
        title: true,
        pricingMode: true,
        autoApplyMaxChange: true,
        pricingSuggestionsEnabled: true,
      },
    }),
  ]);

  const serializedSuggestions = dailySuggestions.map((s) => ({
    id: s.id,
    date: s.date.toISOString().slice(0, 10),
    listingTitle: s.listing.title,
    currency: s.listing.currency ?? "USD",
    suggested: s.suggested,
    basePrice: s.basePrice,
    demandScore: s.demandScore,
    reason: s.reason,
    status: s.status,
    appliedAt: s.appliedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Smart pricing</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Rule-based nightly suggestions — approve or reject, then Apply to publish the new nightly rate
          (<code className="font-mono text-zinc-400">nightPriceCents</code>). Auto modes only act within your safety
          bounds; every apply is logged.
        </p>
      </div>

      {listingModes.length > 0 ? (
        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
          <h2 className="text-sm font-semibold text-white">Listing pricing modes</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listingModes.map((l) => (
              <li key={l.id} className="rounded-xl border border-zinc-800/80 bg-black/40 px-3 py-2 text-xs">
                <p className="font-medium text-white">{l.title}</p>
                <p className="mt-1 text-zinc-500">
                  Mode: <span className="text-zinc-300">{l.pricingMode}</span>
                  {l.autoApplyMaxChange != null ? (
                    <>
                      {" "}
                      · max Δ{" "}
                      <span className="text-zinc-300">{(l.autoApplyMaxChange * 100).toFixed(0)}%</span>
                    </>
                  ) : null}
                  {!l.pricingSuggestionsEnabled ? (
                    <span className="mt-1 block text-amber-600/90">Suggestions disabled for this listing</span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-600">
            OFF / MANUAL → suggestions stay pending until you approve. AUTO_APPROVE_SAFE → rows auto-approve when within
            max Δ; FULL_AUTOPILOT → rows pre-approved (safe cron still applies **tonight only** once per run).
          </p>
        </section>
      ) : null}

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
          <h2 className="text-lg font-semibold text-white">Next 30 nights — suggestions & approvals</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Batch refresh: <code className="font-mono text-zinc-400">GET /api/pricing/generate</code> +{" "}
            <code className="font-mono text-zinc-400">Authorization: Bearer CRON_SECRET</code>. Approve → Apply writes to
            the audit log below.
          </p>
        </div>
        <HostBnhubPricingSuggestionsPanel rows={serializedSuggestions} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Execution log (append-only)</h2>
          <p className="text-xs text-zinc-500">Every apply attempt is recorded — success, skipped, or rejected.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-black/40 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Old → New</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {executionLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    No execution events yet.
                  </td>
                </tr>
              ) : (
                executionLogs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-800/80">
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                      {log.createdAt.toISOString().slice(0, 19)} UTC
                    </td>
                    <td className="px-4 py-3 text-white">{log.listing.title}</td>
                    <td className="px-4 py-3 text-zinc-400">{log.date.toISOString().slice(0, 10)}</td>
                    <td className="px-4 py-3 text-zinc-300">
                      ${log.oldPrice.toFixed(2)} → ${log.newPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{log.mode}</td>
                    <td className="px-4 py-3 text-zinc-400">{log.status}</td>
                    <td className="max-w-lg px-4 py-3 text-xs text-zinc-500">{log.reason ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
