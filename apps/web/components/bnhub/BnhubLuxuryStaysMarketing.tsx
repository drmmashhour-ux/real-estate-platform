"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { listLuxuryBnhubStayShowcases } from "@/components/bnhub/bnhub-luxury-stay-showcase-data";
import { TrustBadge } from "@/components/bnhub/TrustBadge";

type StayRow = {
  slug: string;
  title: string;
  location: string;
  price: string;
  rating: string;
  image: string;
};

const MARKETING_STAYS: StayRow[] = listLuxuryBnhubStayShowcases().map((s) => ({
  slug: s.id,
  title: s.title,
  location: s.location,
  price: s.price,
  rating: s.rating,
  image: s.images[0] ?? "",
}));

function StayCard({ item, detailHref }: { item: StayRow; detailHref: string }) {
  const ratingNum = parseFloat(item.rating) || null;
  return (
    <div className="group overflow-hidden rounded-[28px] border border-white/8 bg-[#0C0C0C]">
      <div
        className="h-80 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url(${item.image})` }}
      />
      <div className="p-5">
        <h3 className="text-xl font-medium text-white">{item.title}</h3>
        <p className="mt-2 text-sm text-white/55">{item.location}</p>
        <TrustBadge
          className="mt-3"
          variant="dark"
          verified
          hostRating={ratingNum}
          reviewCount={12}
          riskLevel="low"
        />
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-lg font-semibold text-[#D4AF37]">{item.price}</div>
          <Link
            href={detailHref}
            className="shrink-0 rounded-full border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            View stay
          </Link>
        </div>
      </div>
    </div>
  );
}

export type BnhubLuxuryStaysMarketingProps = {
  locale: string;
  country: string;
};

/** Demo luxury marketing shell for BNHub stays — use `?view=luxury` on the stays page. */
export function BnhubLuxuryStaysMarketing({ locale, country }: BnhubLuxuryStaysMarketingProps) {
  const base = `/${locale}/${country}`;
  const [search, setSearch] = useState("");

  const filteredStable = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MARKETING_STAYS;
    if (q === "1") return MARKETING_STAYS.filter((s) => s.slug === "skyline-penthouse");
    if (q === "2") return MARKETING_STAYS.filter((s) => s.slug === "lakeside-escape");
    if (q === "3") return MARKETING_STAYS.filter((s) => s.slug === "old-port-loft");
    return MARKETING_STAYS.filter(
      (s) => `${s.title} ${s.location} ${s.slug}`.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 text-center text-xs text-white/45 sm:text-start">
          Luxury presentation mode —{" "}
          <Link href={`${base}/bnhub/stays`} className="text-[#D4AF37] underline-offset-4 hover:underline">
            back to standard stays search
          </Link>
          .
        </p>

        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/78">BNHub</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Luxury Stays, Reimagined
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
            Elevated short-term stays with premium presentation, intelligent tools, and a more refined booking
            experience.
          </p>
        </div>

        <div className="mb-10 rounded-[30px] border border-[#D4AF37]/18 bg-black/40 p-4 shadow-[0_0_70px_rgba(212,175,55,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city, address, or listing ID"
              className="min-h-[52px] flex-1 rounded-[20px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-white placeholder:text-white/35 focus:border-[#D4AF37]/40 focus:outline-none"
            />
            <button
              type="button"
              className="min-h-[52px] shrink-0 rounded-[20px] border border-[#D4AF37]/60 bg-[#D4AF37] px-8 text-sm font-medium text-black hover:brightness-110 sm:px-10"
            >
              Search
            </button>
          </div>
        </div>

        <div className="mb-6 text-sm text-white/55">{filteredStable.length} luxury stays shown</div>

        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {filteredStable.map((item) => (
            <StayCard key={item.slug} item={item} detailHref={`${base}/bnhub/stays/${item.slug}`} />
          ))}
        </div>

        {filteredStable.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/50">No stays match your search.</p>
        ) : null}
      </div>
    </main>
  );
}
