import type { ListingObservationSnapshot } from "@/modules/autonomous-marketplace/types/listing-observation-snapshot.types";

const GOLD = "#D4AF37";

export function ListingPreviewSummaryCard({
  metrics,
}: {
  metrics: ListingObservationSnapshot | null | undefined;
}) {
  if (!metrics) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#111] p-4 text-xs text-zinc-500">
        No listing metrics snapshot — listing may be missing or metrics unavailable.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#111] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Observation metrics</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-300 md:grid-cols-3">
        <div>
          <dt className="text-zinc-600">Views</dt>
          <dd className="font-mono" style={{ color: GOLD }}>
            {metrics.views}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-600">Bookings</dt>
          <dd className="font-mono" style={{ color: GOLD }}>
            {metrics.bookings}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-600">Conversion proxy</dt>
          <dd className="font-mono text-zinc-200">{metrics.conversionRate.toFixed(4)}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Status</dt>
          <dd className="font-mono text-zinc-200">{String(metrics.listingStatus)}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Price (cents)</dt>
          <dd className="font-mono text-zinc-200">{metrics.price ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
