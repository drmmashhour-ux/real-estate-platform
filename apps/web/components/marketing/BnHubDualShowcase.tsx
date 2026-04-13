"use client";

import type { ReactNode } from "react";
import { ChevronLeft, Heart, MapPin, Search, Share2, Star } from "lucide-react";
import { BnHubLogoMark } from "@/components/bnhub/BnHubLogoMark";
import { PLATFORM_NAME } from "@/lib/brand/platform";

/**
 * Two-up mobile composition (listing detail + explore) in LECIPM / BNHUB dark + gold —
 * same layout pattern as common stay-market apps, but on-brand (no light Airbnb chrome).
 */
export function BnHubDualShowcase() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10 text-center">
        <div className="flex justify-center">
          <BnHubLogoMark size="md" className="mx-auto max-w-[min(100%,240px)] opacity-95" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold/90">Product surface</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Rich stays detail · discovery that feels premium
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
          The layout guests expect — hero media, sheeted detail, map-first explore — rendered in {PLATFORM_NAME}{" "}
          black, gold accents, and glassy controls (not generic white templates).
        </p>
      </div>

      <div className="grid gap-12 md:grid-cols-2 md:gap-10 lg:gap-14">
        <figure className="m-0">
          <PhoneChrome ariaLabel="BNHUB listing detail: hero, overlapping detail sheet, host row, LECIPM chrome.">
            <ListingDetailMock />
          </PhoneChrome>
          <figcaption className="mt-6 text-center md:text-left">
            <p className="text-base font-semibold text-white">Listings that read as premium</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
              Gallery, amenities, and trust signals on a dark sheet — cover photos, reviews, and host context stay
              legible in any light.
            </p>
          </figcaption>
        </figure>

        <figure className="m-0">
          <PhoneChrome ariaLabel="BNHUB explore: search, categories, horizontal stays, LECIPM footer.">
            <ExploreHomeMock />
          </PhoneChrome>
          <figcaption className="mt-6 text-center md:text-left">
            <p className="text-base font-semibold text-white">Show up where guests search</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
              Pill search, Stays / Map / Saved, and carousels tuned for Québec cities — same account as web map search.
            </p>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}

function PhoneChrome({ children, ariaLabel }: { children: ReactNode; ariaLabel: string }) {
  return (
    <div
      className="mx-auto w-full max-w-[280px]"
      role="img"
      aria-label={ariaLabel}
    >
      <div className="rounded-[2.35rem] border-[10px] border-[#121212] bg-[#121212] p-[2px] shadow-[0_24px_56px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(212,175,55,0.2)]">
        <div className="relative aspect-[9/19.2] overflow-hidden rounded-[1.85rem] bg-black ring-1 ring-white/[0.07]">
          {children}
        </div>
      </div>
    </div>
  );
}

function ListingDetailMock() {
  return (
    <div className="flex h-full flex-col bg-black text-left">
      {/* Hero */}
      <div className="relative h-[46%] shrink-0 bg-gradient-to-br from-[#2a2318] via-[#121015] to-black">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 90% 70% at 30% 20%, rgb(212 175 55 / 0.25), transparent 55%), linear-gradient(180deg, rgb(0 0 0 / 0.2), rgb(0 0 0 / 0.75))",
          }}
          aria-hidden
        />
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-3 pt-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/10 backdrop-blur-sm">
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="flex gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/10 backdrop-blur-sm">
              <Share2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-premium-gold ring-1 ring-premium-gold/30 backdrop-blur-sm">
              <Heart className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
          </div>
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium tabular-nums text-white ring-1 ring-white/15">
          1 / 24
        </div>
      </div>

      {/* Sheet */}
      <div className="relative z-[1] -mt-5 flex min-h-0 flex-1 flex-col rounded-t-[1.35rem] border border-b-0 border-premium-gold/20 bg-[#0a0a0a] px-3.5 pb-3 pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.65)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" aria-hidden />
        <p className="font-semibold leading-snug text-white">Plateau loft · walkable core</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
          <MapPin className="h-3 w-3 shrink-0 text-premium-gold/80" aria-hidden />
          Condo · Montréal, QC
        </p>
        <p className="mt-2 text-[11px] text-slate-500">4 guests · 2 bedrooms · 2 beds · 1 bath</p>

        <div className="mt-3 grid grid-cols-3 gap-0 border-y border-white/[0.08] py-2.5 text-center text-[10px]">
          <div className="border-r border-white/[0.08]">
            <div className="flex items-center justify-center gap-0.5 text-white">
              <span className="font-semibold tabular-nums">4.9</span>
              <Star className="h-3 w-3 fill-premium-gold text-premium-gold" aria-hidden />
            </div>
            <p className="mt-0.5 text-slate-500">Rating</p>
          </div>
          <div className="border-r border-white/[0.08] px-1">
            <p className="font-semibold text-premium-gold">Guest pick</p>
            <p className="mt-0.5 text-slate-500">Highlight</p>
          </div>
          <div>
            <p className="font-semibold text-white">32</p>
            <p className="mt-0.5 text-slate-500">Reviews</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
          <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-premium-gold/40 to-premium-gold/10 ring-1 ring-premium-gold/35" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-white">Hosted by Marie</p>
            <p className="text-[10px] text-slate-500">3 years hosting · Identity verified</p>
          </div>
        </div>

        <p className="mt-auto pt-2 text-center text-[9px] font-medium tracking-[0.14em] text-premium-gold/80">
          {PLATFORM_NAME}
        </p>
      </div>
    </div>
  );
}

function ExploreHomeMock() {
  return (
    <div className="flex h-full flex-col bg-black px-3 pt-5 text-left">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="rounded-full border border-premium-gold/40 bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-premium-gold">
          BNHUB
        </span>
        <span className="rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-[9px] font-semibold text-slate-300">
          Guest
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/[0.04]">
        <Search className="h-4 w-4 shrink-0 text-premium-gold/90" strokeWidth={1.75} aria-hidden />
        <span className="text-[11px] text-slate-500">Search city or dates</span>
      </div>

      <div className="mt-4 flex justify-center gap-6 border-b border-white/[0.08] pb-2 text-[10px] font-semibold">
        <span className="border-b-2 border-premium-gold pb-2 text-white">Stays</span>
        <span className="pb-2 text-slate-500">Map</span>
        <span className="pb-2 text-slate-500">Saved</span>
      </div>

      <div className="mt-4 min-h-0 flex-1">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-semibold text-white">Popular in Montréal</p>
          <span className="text-[10px] font-medium text-premium-gold">See all</span>
        </div>
        <div className="flex gap-2.5 overflow-hidden">
          <StayCard title="Loft · Mile End" price="$164" unit="/ night" />
          <StayCard title="Row house · Sud-Ouest" price="$212" unit="/ night" />
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold text-white">This weekend</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-premium-gold/15 via-[#141414] to-black ring-1 ring-white/10" aria-hidden />
            <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[#1a2535] via-[#0f0f12] to-black ring-1 ring-white/10" aria-hidden />
          </div>
        </div>
      </div>

      <p className="mt-auto pb-1 text-center text-[9px] font-medium tracking-[0.14em] text-premium-gold/80">
        {PLATFORM_NAME}
      </p>
    </div>
  );
}

function StayCard({ title, price, unit }: { title: string; price: string; unit: string }) {
  return (
    <div className="w-[min(50%,8.5rem)] shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0c]">
      <div className="relative aspect-square bg-gradient-to-br from-premium-gold/20 via-[#1a1810] to-black">
        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-premium-gold ring-1 ring-white/10 backdrop-blur-sm">
          <Heart className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <div className="p-2">
        <p className="line-clamp-2 text-[10px] font-medium leading-tight text-white">{title}</p>
        <p className="mt-1 text-[10px]">
          <span className="font-semibold text-premium-gold">{price}</span>
          <span className="text-slate-500"> {unit}</span>
        </p>
      </div>
    </div>
  );
}
