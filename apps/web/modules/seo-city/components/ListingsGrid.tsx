import Link from "next/link";

import type { SeoCityListingsPreview } from "../seo-city.types";

type Props = { title: string; items: SeoCityListingsPreview[]; viewAllHref?: string; viewAllLabel?: string };

export function ListingsGrid({ title, items, viewAllHref, viewAllLabel }: Props) {
  if (items.length === 0) return null;
  return (
    <section className="mt-12" aria-labelledby="seo-listings">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="seo-listings" className="text-2xl font-semibold text-slate-900">
          {title}
        </h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-sm font-semibold text-rose-600 hover:text-rose-700">
            {viewAllLabel ?? "View all →"}
          </Link>
        ) : null}
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((l) => (
          <li key={l.id}>
            <Link
              href={l.href}
              className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-rose-200"
            >
              {l.image ? (
                <div
                  className="aspect-[4/3] w-full bg-slate-200 bg-cover bg-center"
                  style={{ backgroundImage: `url(${l.image})` }}
                />
              ) : (
                <div className="aspect-[4/3] w-full bg-slate-200" />
              )}
              <div className="p-4">
                <p className="line-clamp-2 font-medium text-slate-900">{l.title}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{l.priceLabel}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
