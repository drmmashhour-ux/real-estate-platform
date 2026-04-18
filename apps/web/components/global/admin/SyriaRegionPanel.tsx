import { engineFlags } from "@/config/feature-flags";
import {
  buildRegionListingKey,
  stringifyRegionListingKey,
} from "@/modules/integrations/regions/region-listing-key.service";
import { buildSyriaDashboardAugmentation } from "@/modules/global-intelligence/global-dashboard.service";
import {
  getRegionSummary,
  listFlaggedListings,
  SYRIA_REGION_CODE,
} from "@/modules/integrations/regions/syria/syria-region-adapter.service";
import { getSyriaCapabilityNotes, canSyriaUsePreview } from "@/modules/integrations/regions/syria/syria-region-capabilities.service";

/** Admin Syria region snapshot — black / gold palette; server-rendered; read-only. */
export async function SyriaRegionPanel() {
  if (!engineFlags.syriaRegionAdapterV1) {
    return (
      <section className="rounded-2xl border border-amber-500/20 bg-zinc-950/60 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400/90">Syria region</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Region adapter is disabled. Set <code className="text-amber-200/90">FEATURE_SYRIA_REGION_ADAPTER_V1=1</code> to surface
          aggregate metrics (read-only).
        </p>
      </section>
    );
  }

  const [{ summary, availabilityNotes }, flagged, aug] = await Promise.all([
    getRegionSummary(),
    listFlaggedListings(8),
    buildSyriaDashboardAugmentation(),
  ]);

  const capabilityNotes = getSyriaCapabilityNotes();
  const previewReady = engineFlags.syriaPreviewV1 && canSyriaUsePreview();

  return (
    <section className="rounded-2xl border border-amber-500/25 bg-[#0a0a0a] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400/90">Syria region (read-only)</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Aggregates from <code className="text-zinc-400">syria_*</code> tables — no writes from web; Québec legal packs are not applied.
          </p>
        </div>
        {summary ? (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase text-emerald-200">
            snapshot ok
          </span>
        ) : (
          <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-[10px] uppercase text-zinc-400">no aggregate</span>
        )}
      </div>

      {availabilityNotes.length > 0 ? (
        <ul className="mt-4 list-inside list-disc text-xs text-amber-200/80">
          {availabilityNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total listings" value={summary?.totalListings ?? "—"} />
        <Metric label="Pending review" value={summary?.pendingReviewListings ?? "—"} />
        <Metric label="Featured" value={summary?.featuredListings ?? "—"} />
        <Metric label="Fraud flags (listings)" value={summary?.fraudFlaggedListings ?? "—"} />
        <Metric label="Bookings" value={summary?.totalBookings ?? "—"} />
        <Metric label="BNHub stays (properties)" value={summary?.bnhubStaysListings ?? "—"} />
        <Metric label="Payouts pending" value={summary?.payoutsPending ?? "—"} />
        <Metric label="Payouts paid" value={summary?.payoutsPaid ?? "—"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Booking volume hint</h3>
          <p className="mt-2 text-2xl font-semibold text-white">
            {summary?.bookingGrossHint != null ? summary.bookingGrossHint.toLocaleString("en-CA") : "—"}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Sum of non-cancelled booking totals (Syria currency).</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Capability notes</h3>
          <ul className="mt-2 space-y-1 text-xs text-zinc-400">
            {capabilityNotes.slice(0, 8).map((n) => (
              <li key={n}>• {n}</li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-zinc-500">
            Preview pipeline:{" "}
            <span className={previewReady ? "text-emerald-400/90" : "text-zinc-500"}>{previewReady ? "available (DRY_RUN)" : "off"}</span>
            {previewReady ? (
              <span className="text-zinc-600">
                {" "}
                — add <code className="text-zinc-500">?syriaListing=&lt;id&gt;</code> on this page.
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {aug.regionComparison.length > 0 ? (
        <div className="mt-8 overflow-x-auto">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Region comparison</h3>
          <table className="mt-3 w-full min-w-[560px] text-left text-xs text-zinc-300">
            <thead className="border-b border-white/10 text-[10px] uppercase text-zinc-500">
              <tr>
                <th className="py-2 pr-3">Region</th>
                <th className="py-2 pr-3">Listings</th>
                <th className="py-2 pr-3">Pending</th>
                <th className="py-2 pr-3">Featured</th>
                <th className="py-2 pr-3">Fraud flags</th>
                <th className="py-2">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {aug.regionComparison.map((row) => (
                <tr key={row.regionCode} className="border-b border-white/5">
                  <td className="py-2 pr-3 font-medium text-zinc-200">{row.label}</td>
                  <td className="py-2 pr-3">{row.totalListings}</td>
                  <td className="py-2 pr-3">{row.pendingReview}</td>
                  <td className="py-2 pr-3">{row.featuredListings}</td>
                  <td className="py-2 pr-3">{row.fraudFlaggedListings}</td>
                  <td className="py-2">{row.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Flagged listings</h3>
        {flagged.items.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No flagged rows or adapter returned empty.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10">
            {flagged.items.map((item) => {
              const key = buildRegionListingKey({
                regionCode: SYRIA_REGION_CODE,
                source: "syria",
                listingId: item.id,
              });
              const wire = key ? stringifyRegionListingKey(key) : null;
              return (
                <li key={item.id} className="flex flex-col gap-1 px-3 py-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <span className="min-w-0 truncate text-zinc-200">{item.title}</span>
                  <span className="shrink-0 font-mono text-[11px] text-zinc-500">{item.city}</span>
                  <span className="shrink-0 text-amber-400/90">risk {item.riskScore}</span>
                  {engineFlags.regionListingKeyV1 && wire ? (
                    <span className="font-mono text-[10px] text-zinc-600">{wire}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {flagged.availabilityNotes.length > 0 ? (
          <p className="mt-2 text-xs text-zinc-500">{flagged.availabilityNotes.join(" · ")}</p>
        ) : null}
      </div>
    </section>
  );
}

function Metric(props: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{props.label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{props.value}</p>
    </div>
  );
}
