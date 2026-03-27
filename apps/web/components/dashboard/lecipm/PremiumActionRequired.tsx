import Link from "next/link";
import type { CommandListingRow } from "@/lib/dashboard/command-center-data";

function severity(listing: CommandListingRow): "danger" | "warning" | "neutral" {
  if (listing.trustScore != null && listing.trustScore < 50) return "danger";
  if (listing.status === "DRAFT" || listing.status === "PENDING_VERIFICATION") return "warning";
  if (listing.trustScore != null && listing.trustScore < 70) return "warning";
  return "neutral";
}

export function PremiumActionRequired({ listings }: { listings: CommandListingRow[] }) {
  const needs = listings
    .filter((l) => severity(l) !== "neutral")
    .sort((a, b) => (a.trustScore ?? 100) - (b.trustScore ?? 100))
    .slice(0, 8);

  if (needs.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-6 text-sm text-emerald-100/90">
        No urgent listing issues detected. Keep analyses fresh for best results.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {needs.map((l) => {
        const sev = severity(l);
        const border =
          sev === "danger" ? "border-red-500/35 bg-red-950/20" : "border-amber-500/30 bg-amber-950/15";
        return (
          <li key={l.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${border}`}>
            <div>
              <p className="font-medium text-slate-100">{l.title}</p>
              <p className="text-xs text-slate-500">
                {l.city} · Trust {l.trustScore ?? "—"} · {l.status}
              </p>
            </div>
            <Link
              href={`/dashboard/seller/listings/${l.id}`}
              className="shrink-0 rounded-full bg-[#C9A646] px-4 py-2 text-xs font-bold text-black hover:bg-[#d4b35c]"
            >
              Fix now
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
