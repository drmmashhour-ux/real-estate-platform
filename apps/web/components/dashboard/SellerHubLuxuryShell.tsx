"use client";

import Link from "next/link";

import type { SellerLuxuryDashboardData } from "@/modules/dashboard/view-models";

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-6">
      <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-white/50">{sub}</div>
    </div>
  );
}

function ListingRow({
  title,
  status,
  price,
  views,
  manageHref,
}: {
  title: string;
  status: string;
  price: string;
  views: number;
  manageHref: string;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-4 rounded-2xl border border-white/8 bg-[#0B0B0B] px-5 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-6">
      <div className="min-w-0">
        <h4 className="font-medium text-white">{title}</h4>
        <p className="mt-1 text-sm text-white/50">{views.toLocaleString()} views · 30d</p>
      </div>
      <div className="text-sm text-white/60 sm:text-end">{status}</div>
      <div className="text-end font-medium text-[#D4AF37] sm:text-end">{price}</div>
      <div className="sm:justify-self-end">
        <Link
          href={manageHref}
          className="inline-flex w-full justify-center rounded-full border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10 sm:w-auto"
        >
          Manage
        </Link>
      </div>
    </div>
  );
}

function LeadCard({
  name,
  interest,
  property,
  contactHref,
}: {
  name: string;
  interest: string;
  property: string;
  contactHref: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[#111111] p-5">
      <h4 className="font-medium text-white">{name}</h4>
      <p className="mt-2 text-sm text-white/50">{interest}</p>
      <p className="mt-2 text-sm text-[#D4AF37]">{property}</p>

      <Link
        href={contactHref}
        className="mt-4 flex w-full items-center justify-center rounded-full border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
      >
        View listing
      </Link>
    </div>
  );
}

type Props = {
  locale: string;
  country: string;
  data: SellerLuxuryDashboardData;
};

export function SellerHubLuxuryShell({ locale, country, data }: Props) {
  const base = `/${locale}/${country}`;
  const classicHref = `${base}/dashboard/seller?classic=1`;
  const s = data.stats;

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 text-center text-xs text-white/45 sm:text-start">
          Live seller metrics from your FSBO listings.{" "}
          <Link href={classicHref} className="text-[#D4AF37] underline-offset-4 hover:underline">
            Open classic workspace
          </Link>
        </p>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/78">Seller Hub</div>
            <h1 className="mt-3 text-4xl font-semibold text-white">Manage your assets.</h1>
            <p className="mt-4 max-w-2xl text-white/60">Track performance, manage listings, and convert interest into transactions.</p>
          </div>

          <Link
            href={`${base}/dashboard/seller/create`}
            className="inline-flex rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-medium text-black hover:brightness-110"
          >
            + Create Listing
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Published" value={String(s.publishedListings)} sub={`${s.listingsOwned} total owned`} />
          <StatCard label="Views (30d)" value={s.viewsLast30d.toLocaleString()} sub="Buyer listing views" />
          <StatCard label="Leads" value={String(s.leadsTotal)} sub="Inbound inquiries" />
          <StatCard label="In progress" value={String(s.documentsIncomplete)} sub="Draft or verification queue" />
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-medium text-white">Your listings</h2>
              <Link href={`${base}/dashboard/seller/listings`} className="text-sm text-[#D4AF37] hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {data.listings.length === 0 ? (
                <p className="text-sm text-white/45">No listings yet — create one to appear here.</p>
              ) : (
                data.listings.map((l) => (
                  <ListingRow
                    key={l.id}
                    title={l.title}
                    status={l.statusLabel}
                    price={l.priceDisplay}
                    views={l.views30d}
                    manageHref={`${base}/dashboard/seller/listings/${l.id}`}
                  />
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-6">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Recent leads</div>

              <div className="mt-5 space-y-4">
                {data.leads.length === 0 ? (
                  <p className="text-sm text-white/45">No inbound leads yet — optimize photos and pricing to attract buyers.</p>
                ) : (
                  data.leads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      name={lead.contactName}
                      interest={lead.interestLine}
                      property={lead.propertyTitle}
                      contactHref={`${base}/dashboard/seller/listings/${lead.listingId}`}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[#090909] p-6">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Signals</div>

              <p className="mt-4 text-sm text-white/60">
                {s.pendingReview > 0
                  ? `${s.pendingReview} listing${s.pendingReview === 1 ? "" : "s"} awaiting verification — complete documents to reduce time-to-live.`
                  : "Verification queue clear — focus on responding to leads within 24 hours."}
              </p>

              <Link
                href={`${base}/dashboard/seller/listings`}
                className="mt-6 flex w-full items-center justify-center rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-medium text-black hover:brightness-110"
              >
                Open listings
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
