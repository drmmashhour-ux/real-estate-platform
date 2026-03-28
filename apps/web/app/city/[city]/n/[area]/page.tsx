import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CITY_SLUGS, getCityPageConfig, parseCitySlugParam, type CitySlug } from "@/lib/geo/city-search";
import { getNeighborhoodEntry, listNeighborhoodSlugs } from "@/src/modules/demand-engine/neighborhoodRegistry";
import { buildCityInternalLinks } from "@/src/modules/demand-engine/internalLinking";

export const revalidate = 300;

type Props = { params: Promise<{ city: string; area: string }> };

export function generateStaticParams() {
  const out: { city: string; area: string }[] = [];
  for (const city of CITY_SLUGS) {
    for (const area of listNeighborhoodSlugs(city)) {
      out.push({ city, area });
    }
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: rawCity, area } = await params;
  const slug = parseCitySlugParam(rawCity);
  if (!slug) return { title: "Neighborhood" };
  const n = getNeighborhoodEntry(slug, area);
  if (!n) return { title: "Neighborhood" };
  const c = getCityPageConfig(slug);
  const title = `${n.title} — ${c.heroTitle} | LECIPM`;
  return {
    title,
    description: n.description,
    openGraph: { title, description: n.description },
  };
}

export default async function NeighborhoodPage({ params }: Props) {
  const { city: rawCity, area } = await params;
  const slug = parseCitySlugParam(rawCity);
  if (!slug) notFound();
  const n = getNeighborhoodEntry(slug, area);
  if (!n) notFound();

  const cityCfg = getCityPageConfig(slug);
  const searchQ = encodeURIComponent(n.searchHint);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
          <Link href={`/city/${slug}`} className="hover:underline">
            {cityCfg.heroTitle}
          </Link>
          <span className="text-slate-400"> / </span>
          Neighborhood
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-slate-900">{n.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{n.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/bnhub/stays?city=${slug}&q=${searchQ}`}
            className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Browse stays near {n.title}
          </Link>
          <Link
            href={`/buy/${slug}?q=${searchQ}`}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-premium-gold/50"
          >
            Buy in this area
          </Link>
        </div>
        <nav className="mt-12 flex flex-wrap gap-2 text-sm" aria-label="Related pages">
          {buildCityInternalLinks(slug as CitySlug).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-rose-200 hover:text-rose-700"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
