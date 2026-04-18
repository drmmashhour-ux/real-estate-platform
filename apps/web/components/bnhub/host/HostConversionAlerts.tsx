import type { BNHubListingConversionSummaryV1 } from "@/modules/bnhub/conversion/bnhub-guest-conversion.types";

type ListingRef = { id: string; title: string };

/**
 * Surfaces rule-based conversion alerts (per-listing) on the host dashboard.
 */
export function HostConversionAlerts({
  conversionByListingId,
  listings,
}: {
  conversionByListingId: Record<string, BNHubListingConversionSummaryV1>;
  listings: ListingRef[];
}) {
  const titleById = new Map(listings.map((l) => [l.id, l.title] as const));
  const rows: { listingId: string; title: string; severity: "warn" | "critical"; message: string }[] = [];

  for (const [listingId, summary] of Object.entries(conversionByListingId)) {
    const title = titleById.get(listingId) ?? listingId.slice(0, 8);
    for (const a of summary.alerts) {
      rows.push({ listingId, title, severity: a.severity, message: a.message });
    }
  }

  if (rows.length === 0) return null;

  const critical = rows.filter((r) => r.severity === "critical");

  return (
    <section
      className="bnhub-panel mb-8 rounded-2xl border border-amber-600/35 bg-amber-950/25 p-4 text-amber-50"
      aria-live="polite"
    >
      <h2 className="text-sm font-semibold tracking-tight text-amber-100">
        Booking conversion alerts {critical.length > 0 ? `(${critical.length} priority)` : ""}
      </h2>
      <ul className="mt-3 space-y-3 text-sm">
        {rows.slice(0, 8).map((r, idx) => (
          <li
            key={`${r.listingId}-${idx}`}
            className={`rounded-xl border px-3 py-2 text-left ${
              r.severity === "critical"
                ? "border-red-700/60 bg-red-950/40 text-red-50"
                : "border-amber-700/40 bg-black/25 text-amber-100"
            }`}
          >
            <p className="font-medium text-white">{r.title}</p>
            <p className="mt-1 text-[13px] leading-snug opacity-95">{r.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
