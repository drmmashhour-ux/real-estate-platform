import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CITY_SLUGS, getCityPageConfig, parseCitySlugParam, type CitySlug } from "@/lib/geo/city-search";
import { AreaOverview } from "@/modules/seo-city/components/AreaOverview";
import { BrokerCTA } from "@/modules/seo-city/components/BrokerCTA";
import { SeoCityTracker } from "@/modules/seo-city/components/SeoCityTracker";
import { generateSeoCityModel, metadataForSeoModel } from "@/modules/seo-city/seo-city-generator.service";
import { isCitySearchPageEnabled } from "@/modules/multi-city/cityRolloutGate";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

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
  if (!slug) return { title: "Brokers" };
  const model = await generateSeoCityModel("BROKER", slug);
  const meta = metadataForSeoModel(model, `/${locale}/${country}/city/${slug}/brokers`);
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: meta.openGraph,
    alternates: meta.alternates,
  };
}

export default async function SeoCityBrokersPage({ params }: PageProps) {
  const { city: raw, locale, country } = await params;
  const slug = parseCitySlugParam(raw);
  if (!slug) notFound();
  if (!(await isCitySearchPageEnabled(prisma, slug))) notFound();

  const model = await generateSeoCityModel("BROKER", slug);
  const cfg = getCityPageConfig(slug);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SeoCityTracker path={`/${locale}/${country}/city/${slug}/brokers`} />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
          <Link href={`/city/${slug}`} className="hover:underline">
            {cfg.heroTitle}
          </Link>{" "}
          / brokers
        </p>
        <h1 className="mt-2 text-3xl font-bold">Brokers in {label(slug)}</h1>
        <p className="mt-2 text-slate-600">
          Program details vary by market — the copy below is editorial, not a regulatory claim about licensing.
        </p>
        <div className="mt-8">
          <AreaOverview blocks={model.content} />
        </div>
        <BrokerCTA
          cityLabel={label(slug)}
          brokerSignUpHref={`/${locale}/${country}/signup?role=broker&ref=city-brokers-${slug}`}
          browseHref={`/city/${slug}`}
        />
        <nav className="mt-10 flex flex-wrap gap-2 text-sm text-slate-600" aria-label="Related">
          {model.internalLinks.slice(0, 10).map((l) => (
            <Link key={l.label + l.href} href={l.href} className="rounded-full border border-slate-200 px-3 py-1 hover:border-rose-200">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
