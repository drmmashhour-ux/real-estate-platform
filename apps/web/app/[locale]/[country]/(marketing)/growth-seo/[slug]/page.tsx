import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GrowthSeoLeadBlock, GrowthSeoVisitTracker } from "@/components/growth/GrowthSeoPageClient";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { getSeoLandingDefinition, listSeoLandingSlugs } from "@/modules/growth/seo/seo-page.service";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; country: string; slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, country, slug } = await props.params;
  const def = getSeoLandingDefinition(slug, locale, country);
  if (!def) return {};
  const path = `/growth-seo/${slug}`;
  return buildPageMetadata({
    title: def.title,
    description: def.description,
    path,
    locale,
    country,
    keywords: def.keywords,
    type: "article",
  });
}

export function generateStaticParams() {
  return listSeoLandingSlugs().map((slug) => ({ slug }));
}

export default async function GrowthSeoLandingPage(props: Props) {
  const { locale, country, slug } = await props.params;
  const def = getSeoLandingDefinition(slug, locale, country);
  if (!def) notFound();

  const path = `/${locale}/${country}/growth-seo/${slug}`;
  const base = getSiteBaseUrl().replace(/\/$/, "");
  const jsonLd =
    def.jsonLdType === "SoftwareApplication" ?
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: def.title.split("|")[0]?.trim() ?? "LECIPM",
        description: def.description,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
        url: `${base}${path}`,
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: def.title,
        description: def.description,
        url: `${base}${path}`,
      };

  return (
    <>
      <GrowthSeoVisitTracker path={path} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="mx-auto max-w-3xl flex-1 space-y-12 px-4 py-14">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Growth SEO</p>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{def.hero}</h1>
          <p className="text-lg text-zinc-400">{def.description}</p>
          <p className="text-xs text-zinc-600">Keywords: {def.keywords.join(", ")}</p>
        </header>

        {def.sections.map((s, i) => (
          <section key={`${s.heading}-${i}`} className="space-y-3">
            <h2 className="text-xl font-semibold text-white">{s.heading}</h2>
            {s.body.map((p, j) => (
              <p key={`${i}-${j}`} className="text-zinc-300">
                {p}
              </p>
            ))}
            {s.bullets && s.bullets.length > 0 ?
              <ul className="list-inside list-disc space-y-2 text-zinc-400">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            : null}
          </section>
        ))}

        <GrowthSeoLeadBlock def={def} />
      </article>
    </>
  );
}
