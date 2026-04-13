import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { growthCityDisplayName, parseGrowthCitySlugParam } from "@/lib/growth/geo-slugs";
import { breadcrumbListJsonLd, webPageJsonLd } from "@/src/modules/seo/structuredData";

export const revalidate = 300;

type Props = { params: Promise<{ city: string; locale: string; country: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, locale, country } = await params;
  const slug = parseGrowthCitySlugParam(city);
  if (!slug) return { title: "Invest" };
  const name = growthCityDisplayName(slug);
  const path = `/invest/${slug}`;
  return buildPageMetadata({
    title: `Real estate investment in ${name} | LECIPM`,
    description: `Research opportunities, deals, and BNHUB demand signals in ${name} — LECIPM investment hub.`,
    path,
    locale,
    country,
  });
}

export default async function InvestCityPage({ params }: Props) {
  const { city } = await params;
  const slug = parseGrowthCitySlugParam(city);
  if (!slug) notFound();

  const name = growthCityDisplayName(slug);
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://lecipm.com").replace(/\/$/, "");
  const path = `/invest/${slug}`;
  const breadcrumbs = breadcrumbListJsonLd(
    [
      { name: "Home", path: "/" },
      { name: "Invest", path: "/invest/tools" },
      { name, path },
    ],
    base
  );
  const pageLd = webPageJsonLd({
    name: `Invest in ${name}`,
    description: `Investment intent landing for ${name} on LECIPM.`,
    url: `${base}${path}`,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 text-slate-100">
      <JsonLdScript data={breadcrumbs} />
      <JsonLdScript data={pageLd} />
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">Invest</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold">{name}</h1>
      <p className="mt-4 text-slate-300">
        Explore tools and listings tied to this market. BNHUB short-term demand complements long-horizon investment
        workflows on LECIPM.
      </p>
      <ul className="mt-8 space-y-3 text-sm">
        <li>
          <Link href="/invest/tools" className="text-emerald-400 hover:text-emerald-300">
            Investor tools →
          </Link>
        </li>
        <li>
          <Link href={`/buy/${slug}`} className="text-emerald-400 hover:text-emerald-300">
            Buy in {name} →
          </Link>
        </li>
        <li>
          <Link href={`/bnhub/stays?city=${slug}`} className="text-emerald-400 hover:text-emerald-300">
            Stays (demand signal) →
          </Link>
        </li>
      </ul>
    </div>
  );
}
