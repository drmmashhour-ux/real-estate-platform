"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, Calendar, Check, ChevronRight, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";
import { BnhubButton } from "@/components/bnhub/BnhubButton";
import { calculateBookingTotalCents } from "@/lib/bnhub/booking-revenue-pricing";
import { calculateQuebecRetailTaxOnLodgingBaseExclusiveCents } from "@/lib/tax/quebec-tax-engine";
import type { BnhubUpsellSelection } from "@/lib/monetization/bnhub-checkout-pricing";
import { bnhubUpsellLineCents } from "@/lib/monetization/bnhub-checkout-pricing";

export type FlowStep = "search" | "results" | "listing" | "booking" | "confirmation";

type DemoListing = {
  id: string;
  title: string;
  city: string;
  image: string;
  images: string[];
  nightPriceCents: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  bestValue: boolean;
  amenities: string[];
  hostName: string;
  hostRating: number;
  hostReviewCount: number;
  cleaningFeeCents: number;
  reviewSummary: string;
  reviews: { author: string; rating: number; text: string; date: string }[];
};

const LISTINGS: DemoListing[] = [
  {
    id: "demo-1",
    title: "Skyline loft with private terrace",
    city: "Toronto",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80&auto=format&fit=crop",
    ],
    nightPriceCents: 18900,
    rating: 4.92,
    reviewCount: 186,
    verified: true,
    bestValue: true,
    amenities: ["High-speed Wi‑Fi", "Full kitchen", "Dedicated workspace", "In-unit laundry", "Air conditioning"],
    hostName: "Jordan M.",
    hostRating: 4.94,
    hostReviewCount: 312,
    cleaningFeeCents: 7500,
    reviewSummary: "Guests consistently praise the location, cleanliness, and quick host responses.",
    reviews: [
      {
        author: "Alex R.",
        rating: 5,
        text: "Spotless, quiet, and exactly as pictured. Check-in was effortless.",
        date: "Mar 2026",
      },
      {
        author: "Sam K.",
        rating: 5,
        text: "Great value for the neighborhood. Would book again.",
        date: "Feb 2026",
      },
      {
        author: "Priya N.",
        rating: 4,
        text: "Lovely terrace — perfect for morning coffee.",
        date: "Jan 2026",
      },
    ],
  },
  {
    id: "demo-2",
    title: "Minimal studio near transit",
    city: "Toronto",
    image:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1600&q=80&auto=format&fit=crop",
    ],
    nightPriceCents: 14200,
    rating: 4.78,
    reviewCount: 94,
    verified: true,
    bestValue: false,
    amenities: ["Wi‑Fi", "Kitchenette", "Heating", "Elevator access"],
    hostName: "Taylor L.",
    hostRating: 4.81,
    hostReviewCount: 140,
    cleaningFeeCents: 5500,
    reviewSummary: "Recent guests highlight convenience to transit and a responsive host.",
    reviews: [
      { author: "Chris D.", rating: 5, text: "Compact but super functional.", date: "Mar 2026" },
    ],
  },
  {
    id: "demo-3",
    title: "Bright two-bedroom with city views",
    city: "Toronto",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=80&auto=format&fit=crop",
    ],
    nightPriceCents: 24500,
    rating: 4.88,
    reviewCount: 52,
    verified: false,
    bestValue: false,
    amenities: ["Wi‑Fi", "Full kitchen", "Free parking", "Balcony"],
    hostName: "Morgan P.",
    hostRating: 4.85,
    hostReviewCount: 67,
    cleaningFeeCents: 9500,
    reviewSummary: "Families love the space and the views.",
    reviews: [{ author: "Jamie F.", rating: 5, text: "Kids loved the balcony.", date: "Feb 2026" }],
  },
];

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 3;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

function filterByCity(city: string) {
  const q = city.trim().toLowerCase();
  if (!q) return LISTINGS;
  return LISTINGS.filter((l) => l.city.toLowerCase().includes(q) || l.title.toLowerCase().includes(q));
}

const STEPS: { id: FlowStep; label: string }[] = [
  { id: "search", label: "Search" },
  { id: "results", label: "Stays" },
  { id: "listing", label: "Listing" },
  { id: "booking", label: "Book" },
  { id: "confirmation", label: "Done" },
];

export function GuestBookingFlowDemo() {
  const [step, setStep] = useState<FlowStep>("search");
  const [city, setCity] = useState("Toronto");
  const [checkIn, setCheckIn] = useState("2026-05-15");
  const [checkOut, setCheckOut] = useState("2026-05-18");
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [upsells, setUpsells] = useState<BnhubUpsellSelection>({});

  const selected = useMemo(
    () => LISTINGS.find((l) => l.id === selectedId) ?? null,
    [selectedId],
  );

  const nights = nightsBetween(checkIn, checkOut);

  const runSearch = useCallback(() => {
    setResultsLoading(true);
    window.setTimeout(() => {
      setResultsLoading(false);
      setStep("results");
      setSelectedId(null);
    }, 380);
  }, []);

  const openListing = (id: string) => {
    setSelectedId(id);
    setUpsells({});
    setStep("listing");
  };

  const bestMatchId = useMemo(() => {
    const pool = filterByCity(city);
    const verified = pool.filter((l) => l.verified);
    const withValue = verified.length ? verified : pool;
    const sorted = [...withValue].sort((a, b) => {
      if (a.bestValue !== b.bestValue) return a.bestValue ? -1 : 1;
      return b.rating - a.rating;
    });
    return sorted[0]?.id ?? pool[0]?.id ?? LISTINGS[0].id;
  }, [city]);

  const results = filterByCity(city);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const subtotalNights = selected ? selected.nightPriceCents * nights : 0;
  const upsellLines = useMemo(() => bnhubUpsellLineCents(upsells), [upsells]);
  const revenue = useMemo(() => {
    if (!selected) return null;
    const lodgingSubtotal = selected.nightPriceCents * nights;
    const feeBreakdown = calculateBookingTotalCents(selected.nightPriceCents, nights, { upsells });
    const tax = calculateQuebecRetailTaxOnLodgingBaseExclusiveCents(lodgingSubtotal + selected.cleaningFeeCents);
    const totalCents =
      feeBreakdown.baseAmountCents + selected.cleaningFeeCents + tax.taxCents + feeBreakdown.serviceFeeCents;
    return { feeBreakdown, tax, totalCents, lodgingSubtotal };
  }, [selected, nights, upsells]);

  const totalCents = revenue?.totalCents ?? 0;
  const serviceFeeCents = revenue?.feeBreakdown.serviceFeeCents ?? 0;
  const taxCents = revenue?.tax?.taxCents ?? 0;
  const feePercent = revenue?.feeBreakdown.serviceFeePercent ?? 12;
  const hostPayoutCents =
    selected && revenue
      ? revenue.feeBreakdown.hostReceivesCents + selected.cleaningFeeCents
      : 0;

  const confirmBooking = () => {
    const ref = `BNH-${Date.now().toString(36).toUpperCase().slice(-8)}`;
    setBookingRef(ref);
    setStep("confirmation");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {step !== "search" ? (
              <button
                type="button"
                onClick={() => {
                  if (step === "results") setStep("search");
                  else if (step === "listing") setStep("results");
                  else if (step === "booking") setStep("listing");
                  else if (step === "confirmation") setStep("search");
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/80 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">Demo</p>
              <h1 className="truncate text-base font-semibold sm:text-lg">Guest booking flow</h1>
            </div>
          </div>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Progress">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    i <= stepIndex ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "text-white/35"
                  }`}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 ? (
                  <ChevronRight className="mx-0.5 h-3.5 w-3.5 text-white/25" aria-hidden />
                ) : null}
              </div>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {step === "search" ? (
          <section className="mx-auto max-w-lg space-y-10 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Where are you going?</h2>
              <p className="text-base text-white/55">Enter a city and dates — we&apos;ll surface the best match first.</p>
            </div>
            <div className="space-y-5 rounded-3xl border border-white/10 bg-[#0A0A0A] p-6 text-left sm:p-8">
              <label className="block space-y-2">
                <span className="text-xs font-medium uppercase tracking-wider text-white/45">City</span>
                <span className="relative flex items-center">
                  <MapPin className="pointer-events-none absolute left-4 h-5 w-5 text-white/35" aria-hidden />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Toronto"
                    className="h-14 w-full rounded-2xl border border-white/15 bg-black pl-12 pr-4 text-base text-white outline-none ring-[#D4AF37]/0 transition placeholder:text-white/30 focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/25"
                  />
                </span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-white/45">Check-in</span>
                  <span className="relative flex items-center">
                    <Calendar className="pointer-events-none absolute left-4 h-5 w-5 text-white/35" aria-hidden />
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-white/15 bg-black pl-12 pr-4 text-base text-white outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/25"
                    />
                  </span>
                </label>
                <label className="block space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-white/45">Check-out</span>
                  <span className="relative flex items-center">
                    <Calendar className="pointer-events-none absolute left-4 h-5 w-5 text-white/35" aria-hidden />
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-white/15 bg-black pl-12 pr-4 text-base text-white outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/25"
                    />
                  </span>
                </label>
              </div>
              <BnhubButton
                type="button"
                className="h-14 w-full rounded-2xl text-base font-semibold"
                loading={resultsLoading}
                onClick={runSearch}
              >
                Search stays
              </BnhubButton>
            </div>
          </section>
        ) : null}

        {step === "results" ? (
          <section className="space-y-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold sm:text-3xl">Stays in {city.trim() || "your city"}</h2>
                <p className="mt-1 text-sm text-white/50">
                  {checkIn} → {checkOut} · {nights} {nights === 1 ? "night" : "nights"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("search")}
                className="h-12 self-start rounded-xl border border-white/15 px-4 text-sm font-medium text-white/80 transition hover:border-[#D4AF37]/35 hover:text-[#D4AF37] sm:self-auto"
              >
                Edit search
              </button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((l) => {
                const isBest = l.id === bestMatchId;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => openListing(l.id)}
                    className={`group overflow-hidden rounded-2xl border bg-[#0A0A0A] text-left transition hover:border-[#D4AF37]/35 ${
                      isBest ? "border-[#D4AF37]/60 ring-2 ring-[#D4AF37]/25" : "border-white/10"
                    }`}
                  >
                    <div className="relative aspect-[16/11]">
                      <Image
                        src={l.image}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {isBest ? (
                        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-[#D4AF37]/60 bg-black/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#D4AF37] backdrop-blur-sm">
                          <Sparkles className="h-3.5 w-3.5" aria-hidden />
                          Best match
                        </span>
                      ) : null}
                      <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
                        {l.bestValue ? (
                          <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold text-black backdrop-blur-sm">
                            Best value
                          </span>
                        ) : null}
                        {l.verified ? (
                          <span className="rounded-full border border-[#D4AF37]/50 bg-black/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#D4AF37] backdrop-blur-sm">
                            Verified
                          </span>
                        ) : null}
                      </div>
                      <span className="absolute bottom-3 left-3 rounded-xl bg-black/80 px-3 py-2 text-lg font-semibold tabular-nums backdrop-blur-sm">
                        {formatMoney(l.nightPriceCents)}
                        <span className="text-sm font-normal text-white/65"> / night</span>
                      </span>
                    </div>
                    <div className="space-y-2 p-4 sm:p-5">
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-[#D4AF37] sm:text-lg">
                        {l.title}
                      </h3>
                      <p className="text-sm text-white/50">{l.city}</p>
                      <div className="flex min-h-[44px] items-center gap-2 text-sm text-white/75">
                        <Star className="h-4 w-4 shrink-0 fill-[#D4AF37]/90 text-[#D4AF37]" aria-hidden />
                        <span>
                          {l.rating.toFixed(1)} <span className="text-white/45">({l.reviewCount})</span>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === "listing" && selected ? (
          <section className="space-y-10">
            <div className="grid gap-3 sm:grid-cols-3">
              {selected.images.map((src, i) => (
                <div
                  key={src}
                  className={`relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 ${
                    i === 0 ? "sm:col-span-3 aspect-[21/9] sm:aspect-[2.4/1]" : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes={i === 0 ? "(max-width: 640px) 100vw, 1024px" : "(max-width: 640px) 100vw, 33vw"}
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3 sm:px-5">
              <p className="flex items-start gap-2 text-sm text-white/90 sm:text-base">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" aria-hidden />
                <span>
                  <strong className="font-semibold text-[#D4AF37]">Good value for your dates.</strong>{" "}
                  This listing is priced below similar verified stays for these nights.
                </span>
              </p>
            </div>

            <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {selected.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                        Verified listing
                      </span>
                    ) : null}
                    {selected.bestValue ? (
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Best value
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-2xl font-semibold sm:text-3xl">{selected.title}</h2>
                  <p className="flex items-center gap-2 text-white/55">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                    {selected.city}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-[#D4AF37]/90 text-[#D4AF37]" aria-hidden />
                      <strong className="font-semibold text-white">{selected.rating.toFixed(2)}</strong>
                      <span className="text-white/45">· {selected.reviewCount} reviews</span>
                    </span>
                    <span className="text-white/35">|</span>
                    <span className="text-white/60">
                      Host {selected.hostName}{" "}
                      <span className="text-white/45">
                        ({selected.hostRating.toFixed(2)} · {selected.hostReviewCount} reviews)
                      </span>
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5 sm:p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white/45">Review summary</h3>
                  <p className="mt-3 text-base leading-relaxed text-white/80">{selected.reviewSummary}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Amenities</h3>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {selected.amenities.map((a) => (
                      <li key={a} className="flex items-center gap-2 text-sm text-white/75">
                        <Check className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Guest reviews</h3>
                  <ul className="mt-4 space-y-4">
                    {selected.reviews.map((r) => (
                      <li key={r.author + r.date} className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-white">{r.author}</span>
                          <span className="text-xs text-white/40">{r.date}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[#D4AF37]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "fill-transparent text-white/20"}`}
                              aria-hidden
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-white/70">{r.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5 sm:p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white/45">Price breakdown</h3>
                  <p className="mt-1 text-xs text-white/40">Everything below is included in your total — no surprise charges.</p>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/60">
                        {formatMoney(selected.nightPriceCents)} × {nights} nights
                      </dt>
                      <dd className="tabular-nums text-white">{formatMoney(subtotalNights)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/60">Cleaning fee</dt>
                      <dd className="tabular-nums text-white">{formatMoney(selected.cleaningFeeCents)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/60">BNHub service fee ({feePercent}%)</dt>
                      <dd className="tabular-nums text-white">{formatMoney(serviceFeeCents)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/60">Taxes (GST + QST)</dt>
                      <dd className="tabular-nums text-white">{formatMoney(taxCents)}</dd>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <div className="flex justify-between gap-4 text-base font-semibold">
                        <dt>Total ({nights} nights)</dt>
                        <dd className="tabular-nums text-[#D4AF37]">{formatMoney(totalCents)}</dd>
                      </div>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-white/45">
                    Host receives about {formatMoney(hostPayoutCents)} before BNHub host fees — platform keeps the service fee
                    above.
                  </p>
                  <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Optional add-ons</p>
                    {(
                      [
                        ["earlyCheckIn", "Early check-in", upsellLines.earlyCheckIn] as const,
                        ["lateCheckOut", "Late check-out", upsellLines.lateCheckOut] as const,
                        ["cleaningAddon", "Cleaning add-on", upsellLines.cleaningAddon] as const,
                      ] as const
                    ).map(([key, label, cents]) => (
                      <label
                        key={key}
                        className="flex min-h-[48px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#D4AF37]/40"
                      >
                        <span className="text-sm text-white/80">
                          {label}
                          <span className="block text-xs text-white/40">+{formatMoney(cents)}</span>
                        </span>
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-white/30 bg-black accent-[#D4AF37]"
                          checked={Boolean(upsells[key])}
                          onChange={(e) =>
                            setUpsells((u) => ({
                              ...u,
                              [key]: e.target.checked ? true : undefined,
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <BnhubButton
                    type="button"
                    className="mt-6 h-14 w-full rounded-2xl text-base font-semibold"
                    onClick={() => setStep("booking")}
                  >
                    Book
                  </BnhubButton>
                  <p className="mt-3 text-center text-xs text-white/40">You won&apos;t be charged until the host accepts.</p>
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        {step === "booking" && selected ? (
          <section className="mx-auto max-w-lg space-y-8">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold sm:text-3xl">Confirm and book</h2>
              <p className="text-sm text-white/55">Review your trip — totals match what you saw on the listing.</p>
            </div>
            <div className="space-y-6 rounded-3xl border border-white/10 bg-[#0A0A0A] p-6 sm:p-8">
              <div className="flex gap-4">
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10">
                  <Image src={selected.image} alt="" fill className="object-cover" sizes="128px" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{selected.title}</p>
                  <p className="mt-1 text-sm text-white/50">{selected.city}</p>
                  {selected.verified ? (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#D4AF37]">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                      Verified
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Calendar className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                  <span>
                    {checkIn} → {checkOut}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/50">
                  {nights} {nights === 1 ? "night" : "nights"} · {formatMoney(selected.nightPriceCents)} avg / night
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45">Total cost</h3>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-[#D4AF37]">{formatMoney(totalCents)}</p>
                <p className="mt-2 text-sm text-emerald-400/90">
                  No hidden fees — nightly rate, cleaning, add-ons, {feePercent}% platform fee, and taxes are itemized.
                </p>
                <ul className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm text-white/65">
                  <li className="flex justify-between">
                    <span>Stay subtotal (incl. cleaning &amp; add-ons)</span>
                    <span className="tabular-nums">
                      {formatMoney(
                        subtotalNights + selected.cleaningFeeCents + (revenue?.feeBreakdown.upsellsCents ?? 0),
                      )}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Platform fee + taxes</span>
                    <span className="tabular-nums">{formatMoney(serviceFeeCents + taxCents)}</span>
                  </li>
                </ul>
              </div>
              <BnhubButton
                type="button"
                className="h-14 w-full rounded-2xl text-base font-semibold"
                onClick={confirmBooking}
              >
                Confirm booking
              </BnhubButton>
            </div>
          </section>
        ) : null}

        {step === "confirmation" && selected && bookingRef ? (
          <section className="mx-auto max-w-lg space-y-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15">
              <Check className="h-8 w-8 text-[#D4AF37]" aria-hidden />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold sm:text-3xl">Request sent</h2>
              <p className="text-white/55">
                Your booking request for <strong className="text-white">{selected.title}</strong> is on its way to the host.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-6 text-left sm:p-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45">Booking summary</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-white/50">Reference</dt>
                  <dd className="font-mono text-[#D4AF37]">{bookingRef}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/50">Dates</dt>
                  <dd className="text-right text-white">
                    {checkIn} → {checkOut}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/50">Total (if accepted)</dt>
                  <dd className="tabular-nums font-semibold text-white">{formatMoney(totalCents)}</dd>
                </div>
              </dl>
              <div className="mt-6 border-t border-white/10 pt-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/45">Next steps</h4>
                <ul className="mt-3 space-y-3 text-sm text-white/70">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                    Watch for a confirmation email with trip details.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                    Message your host from BNHub once they respond.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                    Payment is only processed after the host accepts — no surprises.
                  </li>
                </ul>
              </div>
            </div>
            <BnhubButton
              type="button"
              variant="secondary"
              className="h-14 w-full rounded-2xl text-base font-semibold"
              onClick={() => {
                setBookingRef(null);
                setSelectedId(null);
                setUpsells({});
                setStep("search");
              }}
            >
              Start over
            </BnhubButton>
          </section>
        ) : null}
      </main>
    </div>
  );
}
