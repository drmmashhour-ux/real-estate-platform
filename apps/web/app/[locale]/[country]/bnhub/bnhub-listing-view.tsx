import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingStatus } from "@prisma/client";
import { getCachedBnhubListingById } from "@/lib/bnhub/cached-listing";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { breadcrumbJsonLd, vacationRentalListingJsonLd } from "@/modules/seo/infrastructure/jsonLd";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { SaveListingButton } from "@/components/bnhub/SaveListingButton";
import { BnhubStayEthicalHeader } from "@/components/bnhub/BnhubStayEthicalHeader";
import { TrustStrip } from "@/components/bnhub/TrustStrip";
import { ListingBadges, deriveBnhubListingBadges } from "@/components/bnhub/ListingBadges";

type BnhubListingRow = NonNullable<Awaited<ReturnType<typeof getCachedBnhubListingById>>>;

export function bnhubGalleryUrls(listing: BnhubListingRow): string[] {
  if (listing.listingPhotos?.length) {
    return listing.listingPhotos.map((p) => p.url).filter(Boolean);
  }
  const photos = listing.photos;
  return Array.isArray(photos) ? photos.filter((x): x is string => typeof x === "string") : [];
}

function isEarlyAccessRegionCity(city: string | null | undefined): boolean {
  if (!city) return false;
  const c = city.toLowerCase();
  return c.includes("montréal") || c.includes("montreal") || c.includes("laval");
}

export async function BnhubListingView(opts: {
  routeLookupKey: string;
  seoCanonicalPath?: string;
  prefill?: { checkIn?: string; checkOut?: string; guests?: string };
  adLanding?: boolean;
}) {
  const listing = await getCachedBnhubListingById(opts.routeLookupKey);
  if (!listing || listing.listingStatus !== ListingStatus.PUBLISHED) notFound();

  const imgs = bnhubGalleryUrls(listing);
  const base = getSiteBaseUrl().replace(/\/$/, "");
  const path = opts.seoCanonicalPath ?? `/stays/${listing.listingCode || listing.id}`;
  const canonicalUrl = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const promo = listing.bnhubHostListingPromotions?.[0];
  const verified = listing.verificationStatus === "VERIFIED";
  const foundingHost = listing.owner?.bnhubIsFoundingHost === true;
  const regionEarly = isEarlyAccessRegionCity(listing.city);
  const cardBadges = deriveBnhubListingBadges({
    verified,
    createdAt: listing.createdAt,
    earlyAccessPercentOff: listing.bnhubEarlyAccessPercentOff,
    foundingHost,
    earlyAccessRegion: regionEarly,
  });

  const demoQs = new URLSearchParams();
  if (opts.prefill?.checkIn) demoQs.set("checkIn", opts.prefill.checkIn);
  if (opts.prefill?.checkOut) demoQs.set("checkOut", opts.prefill.checkOut);
  if (opts.prefill?.guests) demoQs.set("guests", opts.prefill.guests);
  const demoHref = `/bnhub/demo/guest-flow${demoQs.toString() ? `?${demoQs}` : ""}`;

  const breadcrumbLd = breadcrumbJsonLd({
    items: [
      { name: "BNHub", url: `${base}/bnhub` },
      { name: listing.city, url: `${base}/en/ca/search/bnhub?location=${encodeURIComponent(listing.city)}` },
      { name: listing.title, url: canonicalUrl },
    ],
  });

  const listingLd = vacationRentalListingJsonLd({
    listing,
    url: canonicalUrl,
    imageUrls: imgs,
  });

  return (
    <>
      <JsonLdScript data={breadcrumbLd as Record<string, unknown>} />
      <JsonLdScript data={listingLd as Record<string, unknown>} />
      <BnhubStayEthicalHeader
        listingId={listing.id}
        city={listing.city}
        createdAt={listing.createdAt}
        verificationStatus={listing.verificationStatus}
        earlyAccessPercentOff={listing.bnhubEarlyAccessPercentOff}
        foundingHost={foundingHost}
        activePromoPercent={promo?.discountPercent}
        activePromoLabel={promo?.label}
      />
      <main
        className={`min-h-screen bg-[#030303] text-white ${opts.adLanding ? "ring-2 ring-amber-500/20" : ""}`}
      >
        <header className="border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <Link href="/bnhub" className="text-sm font-semibold text-[#D4AF37]">
              ← BNHub
            </Link>
            <div className="flex items-center gap-2">
              <SaveListingButton listingId={listing.id} variant="dark" />
              <Link
                href="/bnhub/concierge"
                className="rounded-xl border border-white/20 px-3 py-2 text-xs font-medium text-white/85 hover:bg-white/5"
              >
                Need help booking?
              </Link>
            </div>
          </div>
        </header>

        <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
                {imgs[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgs[0]} alt="" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-sm text-white/40">
                    Photos coming soon
                  </div>
                )}
              </div>
              {imgs.length > 1 ? (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {imgs.slice(1, 5).map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" className="aspect-square rounded-lg object-cover" />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <ListingBadges badges={cardBadges} dense />
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{listing.title}</h1>
              <p className="text-sm text-white/55">
                {listing.city}
                {listing.listingCode ? ` · ${listing.listingCode}` : ""}
              </p>
              <p className="text-3xl font-semibold tabular-nums text-[#D4AF37]">
                ${(listing.nightPriceCents / 100).toFixed(0)}
                <span className="text-base font-normal text-white/50"> / night</span>
              </p>
              <TrustStrip />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={demoHref}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-[#D4AF37] px-6 text-sm font-semibold text-black hover:brightness-110"
                >
                  Continue to booking flow
                </Link>
                <Link
                  href={`/en/ca/search/bnhub?location=${encodeURIComponent(listing.city)}`}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-white/20 px-6 text-sm font-medium text-white/85 hover:bg-white/5"
                >
                  More stays in this area
                </Link>
              </div>
              <p className="text-xs text-white/45">
                Full calendar checkout lives in the booking demo for now — real availability is enforced server-side
                when you complete a reservation.
              </p>
            </div>
          </div>

          <section className="prose prose-invert mt-12 max-w-none">
            <h2 className="text-lg font-semibold text-white">About this stay</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
              {listing.description?.trim() || "The host hasn’t added a long description yet."}
            </p>
          </section>
        </article>
      </main>
    </>
  );
}
