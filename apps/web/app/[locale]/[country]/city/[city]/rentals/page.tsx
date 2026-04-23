import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CITY_SLUGS, getCityPageConfig, parseCitySlugParam, type CitySlug } from "@/lib/geo/city-search";
import { AreaOverview } from "@/modules/seo-city/components/AreaOverview";
import { SeoCityTracker } from "@/modules/seo-city/components/SeoCityTracker";
import { generateSeoCityModel, metadataForSeoModel } from "@/modules/seo-city/seo-city-generator.service";
import { isCitySearchPageEnabled } from "@/modules/multi-city/cityRolloutGate";
import { prisma } from "@repo/db";

export const revalidate = 300;

export function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

type PageProps = { params: Promise<{ locale: string; country: string; city: string }> };

function label(s: CitySlug) {
  return getCityPageConfig(s).heroTitle.replace(/^Explore\s+/i, "").trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: raw, locale, country } = await params;
  const slug = parseCitySlugParam(raw);
  if (!slug) return { title: "Rentals" };
  const model = await generateSeoCityModel("RENTAL", slug);
  const meta = metadataForSeoModel(model, `/${locale}/${country}/city/${slug}/rentals`);
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: meta.openGraph,
    alternates: {
      /** Prefer /city/.../rent as primary SEO URL to limit duplicate content */
      canonical: `/${locale}/${country}/city/${slug}/rent`,
    },
  };
}

export default async function SeoCityRentalsPage({ params }: PageProps) {
  const { city: raw, locale, country } = await params;
  const slug = parseCitySlugParam(raw);
  if (!slug) notFound();
  if (!(await isCitySearchPageEnabled(prisma, slug))) notFound();

  const model = await generateSeoCityModel("RENTAL", slug);
  const cfg = getCityPageConfig(slug);
  const q = cfg.searchQuery;
  const searchBnhub = `/search/bnhub?location=${encodeURIComponent(q)}`;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SeoCityTracker path={`/${locale}/${country}/city/${slug}/rentals`} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
          <Link href={`/city/${slug}`} className="hover:underline">
            {cfg.heroTitle}
          </Link>{" "}
          / short stays
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold">Short stays in {label(slug)}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Traditional long-term rent discovery may live on partner flows — for BNHUB inventory use search below.
        </p>
        <div className="mt-6">
          <Link
            href={searchBnhub}
            className="inline-flex rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Open BNHUB search
          </Link>
        </div>
        <div className="mt-8">
          <AreaOverview blocks={model.content} />
        </div>
        <p className="mt-8 text-sm text-slate-500">
          <Link className="text-rose-600 underline" href={`/city/${slug}/rent`}>
            City &quot;rent&quot; hub
          </Link>{" "}
          (canonical) — use whichever entry matches your campaign.
        </p>
      </div>
    </div>
  );
}
