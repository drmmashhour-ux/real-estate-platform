"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEFAULT_GLOBAL_FILTERS } from "@/components/search/FilterState";

type BrowseRow = {
  kind: string;
  id: string;
  title: string;
  priceCents: number;
  city: string;
  coverImage: string | null;
  bedrooms: number | null;
};

export function BuyerListingSimilar({ excludeId, city }: { excludeId: string; city: string }) {
  const [rows, setRows] = useState<BrowseRow[] | null>(null);

  useEffect(() => {
    const c = city.trim();
    if (!c || c === "Marketplace") {
      setRows([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/buyer/browse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...DEFAULT_GLOBAL_FILTERS,
            location: c,
            limit: 10,
            page: 1,
          }),
        });
        const j = (await r.json().catch(() => ({}))) as { data?: BrowseRow[] };
        const data = Array.isArray(j.data) ? j.data : [];
        if (!cancelled) {
          setRows(data.filter((x) => x.id !== excludeId).slice(0, 4));
        }
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [excludeId, city]);

  if (rows === null) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6" aria-busy="true">
        <h2 className="text-lg font-semibold text-white">Similar listings</h2>
        <p className="mt-2 text-sm text-white/50">Loading…</p>
      </section>
    );
  }
  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8" aria-labelledby="similar-listings-heading">
      <h2 id="similar-listings-heading" className="text-lg font-semibold tracking-tight text-white">
        Similar listings nearby
      </h2>
      <p className="mt-1 text-sm text-white/55">More properties in {city}</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {rows.map((row) => {
          const price = `$${(row.priceCents / 100).toLocaleString("en-CA")}`;
          const beds = row.bedrooms != null ? `${row.bedrooms} bed` : null;
          return (
            <li key={row.id}>
              <Link
                href={`/listings/${encodeURIComponent(row.id)}`}
                className="group flex gap-4 rounded-xl border border-white/10 bg-black/30 p-3 transition hover:border-[#D4AF37]/35 hover:bg-black/45"
              >
                <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a]">
                  {row.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-white/40">No photo</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-white group-hover:text-[#E8D589]">{row.title}</p>
                  <p className="mt-1 text-base font-bold text-[#D4AF37]">{price}</p>
                  <p className="mt-0.5 truncate text-xs text-white/50">
                    {row.city}
                    {beds ? ` · ${beds}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 text-center">
        <Link
          href={`/listings?location=${encodeURIComponent(city)}`}
          className="text-sm font-medium text-[#D4AF37] underline-offset-4 hover:underline"
        >
          See all in {city}
        </Link>
      </div>
    </section>
  );
}
