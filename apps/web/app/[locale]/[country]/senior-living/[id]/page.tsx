import Link from "next/link";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { getResidence } from "@/modules/senior-living/residence.service";
import { careLevelFriendly, careLevelShortLabel, serviceCategoryFriendly } from "@/modules/senior-living/friendly-copy";
import { SeniorLeadRequestForm } from "@/components/senior-living/SeniorLeadRequestForm";
import { ReadPageAloudButton } from "@/components/senior-living/SeniorLivingPageAssist";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  const r = await getResidence(id);
  if (!r) return {};
  return buildPageMetadata({
    title: `${r.name} — Senior Living | LECIPM`,
    description: r.description?.slice(0, 160) ?? `${r.name} in ${r.city}, ${r.province}.`,
    path: `/senior-living/${id}`,
    locale,
    country,
  });
}

function priceSummary(r: NonNullable<Awaited<ReturnType<typeof getResidence>>>) {
  if (r.priceRangeMin != null && r.priceRangeMax != null) {
    return `About $${Math.round(r.priceRangeMin)} to $${Math.round(r.priceRangeMax)} per month`;
  }
  if (r.basePrice != null) return `Starting around $${Math.round(r.basePrice)} per month`;
  return "Ask the residence for a clear price range";
}

export default async function SeniorResidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, country, id } = await params;
  const sp = await searchParams;
  const matchScoreRaw = sp.matchScore;
  const matchScore =
    typeof matchScoreRaw === "string" && matchScoreRaw.trim() !== "" ? Number(matchScoreRaw) : undefined;
  const matchScoreSafe =
    matchScore != null && Number.isFinite(matchScore) ? Math.max(0, Math.min(100, matchScore)) : null;
  const base = `/${locale}/${country}`;
  const r = await getResidence(id);
  if (!r) notFound();

  const offerings: string[] = [];
  if (r.mealsIncluded) offerings.push("Meals included");
  else offerings.push("Ask whether meals are included");
  if (r.activitiesIncluded) offerings.push("Activities and social programs");
  if (r.has24hStaff) offerings.push("Staff on site day and night");
  if (r.medicalSupport) offerings.push("Health support on site");
  if (r.units.some((u) => u.available && u.price != null)) {
    offerings.push("Some rooms listed with sample monthly rent");
  }

  return (
    <div className="pb-28">
      <main data-senior-residence-main className="mx-auto max-w-4xl px-4 py-8">
        <Link href={`${base}/senior-living`} className="font-semibold text-teal-800 underline">
          ← Senior living home
        </Link>

        <div className="mt-8 flex flex-col gap-6 border-b-2 border-neutral-200 pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-balance">{r.name}</h1>
              <p className="mt-3 text-xl font-semibold text-neutral-900">
                {r.city}, {r.province}
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              {r.verified ?
                <span className="inline-flex items-center justify-center rounded border-2 border-teal-800 bg-teal-50 px-4 py-2 text-base font-bold text-teal-900">
                  Verified residence
                </span>
              : null}
              <ReadPageAloudButton />
            </div>
          </div>
          <p className="text-lg sl-text-muted">
            Questions? Use the contact form at the bottom. For urgent medical help, call your local emergency number.
          </p>
        </div>

        <section className="mt-10" aria-labelledby="offers-heading">
          <h2 id="offers-heading" className="text-2xl font-bold text-neutral-900">
            What this place offers
          </h2>
          <ul className="mt-4 list-disc space-y-3 pl-6 text-lg text-neutral-900">
            {offerings.map((line) => (
              <li key={line}>{line}</li>
            ))}
            {r.servicesOffered.slice(0, 8).map((s) => (
              <li key={s.id}>
                {s.name}
                <span className="sl-text-muted"> — {serviceCategoryFriendly(s.category)}</span>
              </li>
            ))}
          </ul>
          {r.servicesOffered.length === 0 && offerings.length <= 4 ?
            <p className="mt-4 text-lg sl-text-muted">The operator can walk you through services on a call or visit.</p>
          : null}
        </section>

        <section className="mt-12" aria-labelledby="care-heading">
          <h2 id="care-heading" className="text-2xl font-bold text-neutral-900">
            Care level
          </h2>
          <p className="mt-3 text-xl font-semibold text-neutral-900">{careLevelShortLabel(r.careLevel)}</p>
          <p className="mt-4 text-lg leading-relaxed text-neutral-900">{careLevelFriendly(r.careLevel)}</p>
        </section>

        <section className="mt-12" aria-labelledby="price-heading">
          <h2 id="price-heading" className="text-2xl font-bold text-neutral-900">
            Price
          </h2>
          <p className="mt-4 text-xl font-bold text-neutral-900">{priceSummary(r)}</p>
          <p className="mt-3 text-lg sl-text-muted">Prices change. Confirm extras and fees with the residence.</p>
        </section>

        <section className="mt-12" aria-labelledby="photos-heading">
          <h2 id="photos-heading" className="text-2xl font-bold text-neutral-900">
            Photos
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex aspect-[4/3] items-center justify-center rounded-lg border-2 border-dashed border-neutral-400 bg-neutral-100 text-center font-semibold text-neutral-700">
              Photos coming soon
            </div>
            <div className="flex aspect-[4/3] items-center justify-center rounded-lg border-2 border-dashed border-neutral-400 bg-neutral-100 text-center font-semibold text-neutral-700">
              Ask for a tour to see rooms
            </div>
          </div>
        </section>

        {r.description ?
          <section className="mt-12" aria-labelledby="more-heading">
            <h2 id="more-heading" className="text-2xl font-bold text-neutral-900">
              More detail
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-neutral-900">{r.description}</p>
          </section>
        : null}

        <div className="mt-12">
          <SeniorLeadRequestForm residenceId={r.id} matchScore={matchScoreSafe} />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-neutral-800 bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] md:hidden">
        <a
          href="#visit"
          className="sl-btn-primary sl-btn-block-mobile flex min-h-[56px] w-full items-center justify-center text-center no-underline"
        >
          Request a visit
        </a>
      </div>
    </div>
  );
}
