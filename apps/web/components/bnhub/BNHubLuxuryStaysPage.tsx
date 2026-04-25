"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { listLuxuryBnhubStayShowcases } from "@/components/bnhub/bnhub-luxury-stay-showcase-data";
import { TrustBadge } from "@/components/bnhub/TrustBadge";

export type LuxuryStayCard = {
  id: string;
  title: string;
  location: string;
  price: string;
  rating: string;
  image: string;
};

function toCards(): LuxuryStayCard[] {
  return listLuxuryBnhubStayShowcases().map((s) => ({
    id: s.id,
    title: s.title,
    location: s.location,
    price: s.price,
    rating: s.rating,
    image: s.images[0] ?? "",
  }));
}

function StayCard({ item, viewHref }: { item: LuxuryStayCard; viewHref: string }) {
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
            href={viewHref}
            className="shrink-0 rounded-full border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
          >
            View stay
          </Link>
        </div>
      </div>
    </div>
  );
}

type Props = {
  locale: string;
  country: string;
};

export function BNHubLuxuryStaysPage({ locale, country }: Props) {
  const base = `/${locale}/${country}`;
  const stays = useMemo(() => toCards(), []);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stays;
    return stays.filter(
      (s) => s.title.toLowerCase().includes(q) || s.location.toLowerCase().includes(q) || s.id.toLowerCase().includes(q),
    );
  }, [search, stays]);

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/78">BNHub</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">Luxury stays, simplified</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55">
            One search. Verified hosts. Clear nightly pricing.
          </p>
          <p className="mt-3 text-sm text-white/45">
            Live inventory:{" "}
            <Link href={`${base}/search/bnhub`} className="text-[#D4AF37] underline-offset-4 hover:underline">
              open BNHub search
            </Link>
            .
          </p>
        </div>

        <div className="mb-10 rounded-[30px] border border-[#D4AF37]/18 bg-black/40 p-4 shadow-[0_0_70px_rgba(212,175,55,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city, address, or listing ID"
              type="search"
              className="min-h-[52px] flex-1 rounded-[20px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-white placeholder:text-white/35 focus:border-[#D4AF37]/40 focus:outline-none"
              autoComplete="off"
            />
            <button
              type="button"
              className="min-h-[52px] shrink-0 rounded-[20px] border border-[#D4AF37]/60 bg-[#D4AF37] px-8 text-sm font-medium text-black hover:brightness-110 sm:px-10"
            >
              Search
            </button>
          </div>
        </div>

        <div className="mb-6 text-sm text-white/55">
          {filtered.length} curated preview{filtered.length === 1 ? "" : "s"}
        </div>

        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <StayCard key={item.id} item={item} viewHref={`${base}/bnhub/stays/${encodeURIComponent(item.id)}`} />
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/50">No stays match your search.</p>
        ) : null}
      </div>
    </main>
  );
}
