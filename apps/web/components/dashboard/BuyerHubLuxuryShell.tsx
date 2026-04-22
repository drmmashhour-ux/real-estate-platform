"use client";

import Link from "next/link";

import type { BuyerLuxuryDashboardData } from "@/modules/dashboard/view-models";

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-6">
      <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-white/50">{sub}</div>
    </div>
  );
}

function ListingCard({
  title,
  location,
  price,
  image,
  listingsHref,
}: {
  title: string;
  location: string;
  price: string;
  image: string;
  listingsHref: string;
}) {
  return (
    <div className="group overflow-hidden rounded-[28px] border border-white/8 bg-[#0B0B0B]">
      <div
        className="h-64 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="p-5">
        <h3 className="text-xl font-medium text-white">{title}</h3>
        <p className="mt-2 text-sm text-white/55">{location}</p>
        <div className="mt-5 flex items-center justify-between">
          <div className="text-lg font-semibold text-[#D4AF37]">{price}</div>
          <Link
            href={listingsHref}
            className="rounded-full border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

function SavedCard({
  title,
  status,
  price,
  savedHref,
  compareHref,
}: {
  title: string;
  status: string;
  price: string;
  savedHref: string;
  compareHref: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[#111111] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-base font-medium text-white">{title}</h4>
          <p className="mt-2 text-sm text-white/55">{status}</p>
        </div>
        <div className="text-sm font-medium text-[#D4AF37]">{price}</div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={savedHref}
          className="rounded-full border border-[#D4AF37]/35 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          Open
        </Link>
        <Link
          href={compareHref}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
        >
          Compare
        </Link>
      </div>
    </div>
  );
}

type Props = {
  locale: string;
  country: string;
  data: BuyerLuxuryDashboardData;
};

export function BuyerHubLuxuryShell({ locale, country, data }: Props) {
  const base = `/${locale}/${country}`;
  const classicHref = `${base}/dashboard/buyer?classic=1`;
  const s = data.stats;

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 text-center text-xs text-white/45 sm:text-start">
          Live buyer metrics from your account.{" "}
          <Link href={classicHref} className="text-[#D4AF37] underline-offset-4 hover:underline">
            Open classic workspace
          </Link>
        </p>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/78">Buyer Hub</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Discover with confidence.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
              Follow premium listings, compare opportunities, and move through your buying journey with more clarity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`${base}/listings`}
              className="rounded-full border border-[#D4AF37]/45 px-5 py-3 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              Explore listings
            </Link>
            <Link
              href={`${base}/listings/saved`}
              className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-medium text-black hover:brightness-110"
            >
              Saved searches
            </Link>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Saved homes" value={String(s.savedHomesCount)} sub="Wishlist size" />
          <StatCard label="New matches" value={String(s.newMatchesWeek)} sub="Listing views · 7 days" />
          <StatCard label="Price alerts" value={String(s.priceAlertsWeek)} sub="Discovery · 7 days" />
          <StatCard label="Visits planned" value={String(s.visitsPlanned)} sub="Upcoming appointments" />
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-medium text-white">Recommended for You</h2>
              <Link href={`${base}/listings`} className="text-sm text-[#D4AF37] hover:underline">
                View all
              </Link>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {data.recommendations.length === 0 ? (
                <p className="text-sm text-white/45">No active marketplace listings yet — explore the catalog.</p>
              ) : (
                data.recommendations.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    title={listing.title}
                    location={listing.location}
                    price={listing.priceDisplay}
                    image={listing.imageUrl}
                    listingsHref={listing.listingHref}
                  />
                ))
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[linear-gradient(135deg,#0D0D0D,#090909)] p-6">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Alerts</div>
              <div className="mt-5 space-y-3">
                {data.alerts.map((alert, i) => (
                  <div
                    key={`${i}-${alert.slice(0, 24)}`}
                    className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-white/70"
                  >
                    {alert}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-white/35">{s.discoveryAlertsActive} active discovery alert subscriptions.</p>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#0B0B0B] p-6">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Buying Progress</div>
              <h3 className="mt-3 text-2xl font-medium text-white">Your Next Step</h3>
              <p className="mt-3 text-sm leading-7 text-white/60">
                You had {s.listingViewsLast30d} listing views in the last 30 days — refine shortlists and schedule visits for
                top candidates.
              </p>
              <Link
                href={`${base}/compare/fsbo`}
                className="mt-6 inline-flex rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-medium text-black hover:brightness-110"
              >
                Compare top homes
              </Link>
            </div>
          </aside>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-medium text-white">Saved Homes</h2>
            <Link
              href={`${base}/listings/saved`}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
            >
              Manage Collection
            </Link>
          </div>

          {data.savedHomes.length === 0 ? (
            <p className="text-sm text-white/45">No saved homes yet — tap the heart on a listing to build your collection.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {data.savedHomes.map((home) => (
                <SavedCard
                  key={home.id}
                  title={home.title}
                  status={home.statusLine}
                  price={home.priceDisplay}
                  savedHref={`${base}/listings/${home.id}`}
                  compareHref={`${base}/compare/fsbo`}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
