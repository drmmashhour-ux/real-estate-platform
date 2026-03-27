import Link from "next/link";
import type { CommandListingRow } from "@/lib/dashboard/command-center-data";

export function PremiumOpportunities({ listings }: { listings: CommandListingRow[] }) {
  const opps = listings
    .filter((l) => {
      if (l.dealScore == null) return false;
      if (l.dealScore >= 70) return true;
      const rec = (l.dealRecommendation ?? "").toLowerCase();
      return rec.includes("strong") || rec.includes("buy") || rec.includes("good");
    })
    .sort((a, b) => (b.dealScore ?? 0) - (a.dealScore ?? 0))
    .slice(0, 8);

  if (opps.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Run Deal Analyzer on listings to surface opportunities. Estimates only — not advice.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {opps.map((l) => (
        <li
          key={l.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-950/15 px-4 py-3"
        >
          <div>
            <p className="font-medium text-emerald-100/95">{l.title}</p>
            <p className="text-xs text-emerald-200/70">
              Deal score {l.dealScore ?? "—"}
              {l.dealRecommendation ? ` · ${l.dealRecommendation.replace(/_/g, " ")}` : ""}
            </p>
          </div>
          <Link
            href={`/dashboard/seller/listings/${l.id}`}
            className="shrink-0 rounded-full border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-900/40"
          >
            Review
          </Link>
        </li>
      ))}
    </ul>
  );
}
