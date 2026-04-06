import Link from "next/link";
import type { SimilarListingCard } from "@/lib/bnhub/similar-listings";

export function ListingSimilarProperties({ items }: { items: SimilarListingCard[] }) {
  if (!items.length) return null;

  return (
    <section className="mt-10 scroll-mt-8" aria-labelledby="similar-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 id="similar-heading" className="text-lg font-semibold text-slate-200">
          Similar properties
        </h2>
        <p className="text-xs text-slate-500">Same area and comparable price</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((l) => (
          <li key={l.id}>
            <Link
              href={`/bnhub/stays/${l.listingCode}`}
              className="group flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-3 transition hover:border-emerald-500/40 hover:bg-slate-900/80"
            >
              <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-800">
                {l.coverUrl ? (
                  <img
                    src={l.coverUrl}
                    alt=""
                    width={128}
                    height={96}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-600">No photo</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] text-slate-500">{l.listingCode}</p>
                <p className="line-clamp-2 text-sm font-medium text-slate-200">{l.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {l.city} · {l.beds} bd · {l.baths} ba
                  {l.propertyType ? ` · ${l.propertyType}` : ""}
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-400">
                  ${(l.nightPriceCents / 100).toFixed(0)}
                  <span className="text-xs font-normal text-slate-500"> / night</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
