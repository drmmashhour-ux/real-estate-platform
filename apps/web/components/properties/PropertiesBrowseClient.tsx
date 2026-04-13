"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { BROWSE_EMPTY_LISTINGS } from "@/lib/listings/browse-empty-copy";
import type { BrowsePropertyCard } from "@/lib/simulation/browse-properties";

type Props = { initial: BrowsePropertyCard[] };

const CITIES = ["All cities", "Montreal", "Laval", "Longueuil", "Toronto", "Vancouver"];

export function PropertiesBrowseClient({ initial }: Props) {
  const [city, setCity] = useState("All cities");
  const [maxBudget, setMaxBudget] = useState("");

  const filtered = useMemo(() => {
    const maxCents = maxBudget.trim() === "" ? null : Math.round(Number(maxBudget) * 100);
    if (maxCents !== null && (!Number.isFinite(maxCents) || maxCents < 0)) {
      return initial;
    }
    return initial.filter((p) => {
      if (city !== "All cities" && p.city !== city) return false;
      if (maxCents !== null && p.priceCents > maxCents) return false;
      return true;
    });
  }, [initial, city, maxBudget]);

  return (
    <>
      <section className="border-b border-slate-800 bg-slate-900/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            City
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Max price (CAD)
            <input
              type="number"
              placeholder="e.g. 800000"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="w-40 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600"
            />
          </label>
          <p className="text-xs text-slate-500">
            Showing {filtered.length} of {initial.length} listings
          </p>
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((property) => (
              <article
                key={property.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/40 transition hover:-translate-y-1 hover:border-emerald-400/70 hover:shadow-emerald-500/20"
              >
                <div className="relative h-52 overflow-hidden">
                  <div
                    className="h-full w-full bg-cover bg-center transition duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url('${property.image}')` }}
                    role="img"
                    aria-label=""
                  />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${property.tagColor}`}
                  >
                    {property.badge}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-slate-50 sm:text-base">{property.title}</h2>
                    <span className="text-xs font-semibold text-emerald-300 sm:text-sm">{property.price}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{property.city}</p>
                  <p className="mt-2 text-xs text-slate-400 sm:text-sm">{property.meta}</p>
                  <p className="mt-3 line-clamp-2 text-xs text-slate-400 sm:text-sm">{property.highlight}</p>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-slate-500">{property.propertyType}</span>
                    <Link href={`/sell/${property.id}`}>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-100 transition group-hover:bg-emerald-500 group-hover:text-slate-950">
                        View details
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="mt-6">
              <EmptyState title={BROWSE_EMPTY_LISTINGS.title} description={BROWSE_EMPTY_LISTINGS.description}>
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCity("All cities");
                      setMaxBudget("");
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Reset filters
                  </button>
                  <Link
                    href="/explore"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-500/50 px-6 py-2.5 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/10"
                  >
                    Browse featured listings
                  </Link>
                </>
              </EmptyState>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
