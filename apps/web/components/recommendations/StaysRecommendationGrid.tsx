import Link from "next/link";
import type { SimilarListingCard } from "@/lib/recommendations";

type Variant = "light" | "dark";

export function StaysRecommendationGrid({
  title,
  subtitle,
  items,
  variant = "light",
  viewAllHref,
  viewAllLabel,
  sectionId = "stays-recommendations",
}: {
  title: string;
  subtitle?: string;
  items: SimilarListingCard[];
  variant?: Variant;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Stable id for heading / a11y */
  sectionId?: string;
}) {
  if (!items.length) return null;

  const isDark = variant === "dark";
  const cardBorder = isDark ? "border-slate-800 bg-slate-900/50 hover:border-emerald-500/40" : "border-slate-200 bg-white hover:border-rose-200/80";
  const titleCls = isDark ? "text-slate-200" : "text-slate-900";
  const subCls = isDark ? "text-slate-500" : "text-slate-500";
  const textCls = isDark ? "text-slate-200" : "text-slate-900";
  const metaCls = isDark ? "text-slate-500" : "text-slate-600";
  const priceCls = isDark ? "text-emerald-400" : "text-rose-600";

  return (
    <section className="scroll-mt-8" aria-labelledby={sectionId}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id={sectionId} className={`text-lg font-semibold ${titleCls}`}>
            {title}
          </h2>
          {subtitle ? <p className={`mt-1 text-xs ${subCls}`}>{subtitle}</p> : null}
        </div>
        {viewAllHref ? (
          <Link href={viewAllHref} className={`text-sm font-medium ${priceCls} hover:underline`}>
            {viewAllLabel ?? "View all →"}
          </Link>
        ) : null}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((l) => (
          <li key={l.id}>
            <Link
              href={`/bnhub/${l.listingCode}`}
              className={`group flex gap-3 rounded-2xl border p-3 transition ${cardBorder}`}
            >
              <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                {l.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.coverUrl}
                    alt=""
                    width={128}
                    height={96}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">No photo</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`line-clamp-2 text-sm font-medium ${textCls}`}>{l.title}</p>
                <p className={`mt-1 text-xs ${metaCls}`}>
                  {l.city} · {l.beds} bd · {l.baths} ba
                  {l.propertyType ? ` · ${l.propertyType}` : ""}
                </p>
                <p className={`mt-1 text-sm font-semibold ${priceCls}`}>
                  ${(l.nightPriceCents / 100).toFixed(0)}
                  <span className="text-xs font-normal text-slate-500"> / night</span>
                </p>
                <span className={`mt-2 inline-block text-xs font-semibold ${priceCls}`}>
                  View stay →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
