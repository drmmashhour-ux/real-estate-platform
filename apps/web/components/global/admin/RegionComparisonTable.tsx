import type { GlobalRegionSnapshot } from "@/modules/global-intelligence/global-intelligence.types";

export function RegionComparisonTable({ regions }: { regions: GlobalRegionSnapshot[] }) {
  if (!regions.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-black p-4 text-sm text-zinc-500">
        No region rows — registry empty or adapters disabled.
      </div>
    );
  }
  const sorted = [...regions].sort((a, b) => String(a.regionCode).localeCompare(String(b.regionCode)));
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-black">
      <table className="min-w-full text-left text-sm text-zinc-200">
        <thead className="border-b border-zinc-800 bg-zinc-950 text-[10px] uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">Region</th>
            <th className="px-3 py-2">Listings</th>
            <th className="px-3 py-2">Bookings</th>
            <th className="px-3 py-2">Blocked publish</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.regionCode} className="border-b border-zinc-900">
              <td className="px-3 py-2 font-medium text-amber-200">{r.label}</td>
              <td className="px-3 py-2">{r.listingCountHint ?? "—"}</td>
              <td className="px-3 py-2">{r.bookingCountHint ?? "—"}</td>
              <td className="px-3 py-2">{r.blockedPublishHint ?? "—"}</td>
              <td className="px-3 py-2 text-xs text-zinc-500">
                {r.availabilityNotes.slice(0, 2).join(" · ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
