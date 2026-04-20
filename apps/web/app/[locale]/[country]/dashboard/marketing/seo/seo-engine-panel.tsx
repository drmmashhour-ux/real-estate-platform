"use client";

import { useMemo, useState } from "react";
import {
  buildEditorialContentBrief,
  buildInternalLinkPlan,
  buildKeywordPlan,
  createPlaceholderSeoPerformanceSnapshot,
  generateCityPageMetadata,
  generateListingMetadata,
  generateResidenceMetadata,
  generateStayMetadata,
  listLandingPageCandidates,
  validateBriefGuardrails,
  type EditorialBriefTopic,
} from "@/modules/seo-engine";

export function SeoEnginePanel({
  locale,
  country,
}: {
  locale: string;
  country: string;
}) {
  const base = `/${locale}/${country}`;
  const [city, setCity] = useState("Montréal");
  const [propertyType, setPropertyType] = useState("condos");
  const [briefTopic, setBriefTopic] = useState<EditorialBriefTopic>("luxury_rentals_montreal");

  const keywords = useMemo(
    () =>
      buildKeywordPlan({
        city,
        propertyType,
        intent: "buy",
        hub: "marketplace",
      }),
    [city, propertyType]
  );

  const listingMeta = useMemo(
    () =>
      generateListingMetadata({
        title: "Bright corner unit",
        city,
        province: "QC",
        country: "CA",
        propertyCategory: "Condo",
        priceLabel: "$749,000",
        listingUrlPath: `${base}/listings/demo`,
      }),
    [base, city]
  );

  const cityMeta = useMemo(
    () =>
      generateCityPageMetadata({
        city,
        province: "QC",
        country: "CA",
        pageFocus: "sale",
      }),
    [city]
  );

  const stayMeta = useMemo(
    () =>
      generateStayMetadata({
        title: "Loft near Old Port",
        city,
        neighborhood: "Old Montreal",
        nightlyPriceLabel: "$189/night",
        stayUrlPath: `${base}/bnhub/listings/demo`,
      }),
    [base, city]
  );

  const residenceMeta = useMemo(
    () =>
      generateResidenceMetadata({
        residenceName: "Résidence Harmonie",
        city,
        province: "QC",
        residenceServicesUrlPath: `${base}/residence-services/demo`,
      }),
    [base, city]
  );

  const landingCandidates = useMemo(() => listLandingPageCandidates(city), [city]);
  const internalLinks = useMemo(() => buildInternalLinkPlan(base), [base]);
  const perf = useMemo(() => createPlaceholderSeoPerformanceSnapshot({ pagesGeneratedTotal: 42 }), []);
  const brief = useMemo(() => buildEditorialContentBrief(briefTopic), [briefTopic]);
  const briefGuard = useMemo(() => validateBriefGuardrails(brief), [brief]);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <h2 className="text-lg font-semibold text-white">Inputs</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Deterministic previews — brand-safe, location-led. Publish only after editorial review.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-zinc-400">
            City
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="text-sm text-zinc-400">
            Property type (keyword demo)
            <input
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="text-sm text-zinc-400 sm:col-span-2">
            Editorial brief topic
            <select
              value={briefTopic}
              onChange={(e) => setBriefTopic(e.target.value as EditorialBriefTopic)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            >
              <option value="luxury_rentals_montreal">Luxury rentals — Montreal</option>
              <option value="invest_evaluate_laval">Invest — Laval</option>
              <option value="residence_services_family_checklist">Residence services — families</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <h2 className="text-lg font-semibold text-emerald-300">Keyword opportunities</h2>
        <dl className="mt-4 space-y-2 text-sm text-zinc-300">
          <div>
            <dt className="text-zinc-500">Primary</dt>
            <dd className="font-medium text-white">{keywords.primaryKeyword}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Secondary</dt>
            <dd>{keywords.secondaryKeywords.join(" · ")}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Long-tail</dt>
            <dd>{keywords.longTailVariants.join(" · ")}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Angle</dt>
            <dd className="text-zinc-400">{keywords.contentAngle}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <h2 className="text-lg font-semibold text-emerald-300">Metadata drafts</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <MetadataCard label="Listing" bundle={listingMeta} />
          <MetadataCard label="City / area" bundle={cityMeta} />
          <MetadataCard label="BNHub stay" bundle={stayMeta} />
          <MetadataCard label="Residence services" bundle={residenceMeta} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <h2 className="text-lg font-semibold text-emerald-300">Landing page candidates</h2>
        <ul className="mt-4 space-y-4">
          {landingCandidates.map((p) => (
            <li key={p.routeSuggestion} className="rounded-xl border border-zinc-800 bg-black/40 p-4">
              <p className="font-mono text-xs text-zinc-500">{p.routeSuggestion}</p>
              <p className="mt-1 font-semibold text-white">{p.title}</p>
              <p className="mt-2 text-sm text-zinc-400">{p.introParagraph}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <h2 className="text-lg font-semibold text-emerald-300">Content brief</h2>
        <div className="mt-4 space-y-3 text-sm text-zinc-300">
          <p>
            <span className="text-zinc-500">Topic:</span> {brief.topic}
          </p>
          <p>
            <span className="text-zinc-500">Keyword:</span> {brief.keywordTarget}
          </p>
          <ul className="list-inside list-disc space-y-1">
            {brief.outline.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className={`text-xs ${briefGuard.ok ? "text-emerald-500/90" : "text-amber-400"}`}>
            Guardrails: {briefGuard.ok ? "OK" : briefGuard.issues.join("; ")}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <h2 className="text-lg font-semibold text-emerald-300">Internal linking (hub)</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {internalLinks.map((edge) => (
            <li key={edge.sourcePage} className="text-zinc-300">
              <span className="font-mono text-xs text-zinc-500">{edge.sourcePage}</span>
              <ul className="mt-1 list-inside list-disc text-zinc-400">
                {edge.recommendedTargets.map((t) => (
                  <li key={t.path}>
                    {t.path} — {t.anchorSuggestions.join(", ")}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <h2 className="text-lg font-semibold text-emerald-300">Performance summary (placeholder)</h2>
        <dl className="mt-4 space-y-2 text-sm text-zinc-300">
          <div className="flex justify-between gap-4">
            <dt>Pages generated (tracked)</dt>
            <dd>{perf.pagesGeneratedTotal}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Indexed estimate</dt>
            <dd>{perf.indexedTargetsEstimate}</dd>
          </div>
        </dl>
        <ul className="mt-4 list-inside list-disc text-xs text-zinc-500">
          {perf.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-zinc-600">
        LECIPM SEO Engine — programmatic suggestions only. Do not auto-publish thin pages; route drafts through editorial
        review.
      </p>
    </div>
  );
}

function MetadataCard({ label, bundle }: { label: string; bundle: { title: string; metaDescription: string; canonicalPathSuggestion: string } }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 font-semibold text-white">{bundle.title}</p>
      <p className="mt-2 text-sm text-zinc-400">{bundle.metaDescription}</p>
      <p className="mt-3 font-mono text-xs text-zinc-600">{bundle.canonicalPathSuggestion}</p>
    </div>
  );
}
