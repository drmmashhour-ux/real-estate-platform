"use client";

import Link from "next/link";

export function ListingGrowthCard({ basePath }: { basePath: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">Listing growth</h3>
      <p className="mt-2 text-sm text-zinc-400">
        Views, saves, and inquiry signals roll up per listing when performance events are recorded. Use listing
        opportunities for refresh ideas.
      </p>
      <Link href={`${basePath}/listings`} className="mt-3 inline-block text-sm text-emerald-400 hover:underline">
        Open listings →
      </Link>
    </div>
  );
}
