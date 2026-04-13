"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  city: string;
  nightPriceCents: number;
  photos?: unknown;
  aiLabels?: string[];
};

function photoFirst(listing: Listing): string | null {
  const p = listing.photos;
  if (Array.isArray(p) && p.length > 0 && typeof p[0] === "string") return p[0];
  return null;
}

export function LandingRecommendedStays() {
  const [rows, setRows] = useState<Listing[] | null>(null);

  useEffect(() => {
    fetch("/api/search/recommendations", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : Promise.resolve(null)))
      .then((data) => {
        const list = data?.recommendations;
        setRows(Array.isArray(list) ? list : []);
      })
      .catch(() => setRows([]));
  }, []);

  if (rows === null) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
      </section>
    );
  }

  if (rows.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-labelledby="recommended-stays-heading">
      <h2 id="recommended-stays-heading" className="text-2xl font-semibold text-white">
        Recommended for you
      </h2>
      <p className="mt-2 text-sm text-white/70">Based on your recent BNHUB activity and preferences.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.slice(0, 6).map((l) => (
          <Link
            key={l.id}
            href={`/bnhub/stays/${l.id}`}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-[#D4AF37]/40"
          >
            <div className="aspect-[16/10] bg-slate-800">
              {photoFirst(l) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoFirst(l)!} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              ) : null}
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1">
                {(l.aiLabels ?? []).slice(0, 2).map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[11px] font-medium text-[#E8D5A3]"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-2 line-clamp-2 font-semibold text-white">{l.title}</p>
              <p className="mt-1 text-sm text-white/60">{l.city}</p>
              <p className="mt-2 text-lg font-bold text-white">
                ${(l.nightPriceCents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
                <span className="text-sm font-normal text-white/60"> / night</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
