"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Bed, Calendar, ChevronDown, Search, Users, X } from "lucide-react";
import { BrandLogo } from "@/components/ui/Logo";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { SearchEngineBar, SearchFiltersProvider, useSearchEngineContext } from "@/components/search/SearchEngine";
import { STAY_PRICE_PRESETS } from "@/components/search/SearchBar";
import { parseListingCodeFromSearchQuery } from "@/lib/listing-code-public";
import { StaysSearchResults } from "@/app/bnhub/stays/stays-search-client";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { BnhubStaysQuerySync } from "@/components/bnhub/BnhubStaysQuerySync";

const NAV = [
  { label: "Stays", href: "/bnhub/stays", active: true },
  { label: "Long-term rent", href: "/listings?dealType=RENT", active: false },
  { label: "Buy", href: "/listings", active: false },
  { label: "Trips", href: "/bnhub/trips", active: false },
  { label: "Travel AI", href: "/bnhub/travel/compare", active: false },
] as const;

function fmtDateShort(iso: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function BookingStaysHeroBar() {
  const router = useRouter();
  const destinationFieldId = useId();
  const {
    draft,
    setDraft,
    apply,
    setFiltersOpen,
    activeFilterCount,
    applyPricePresetStays,
    pricePresetId,
  } = useSearchEngineContext();

  const [searchTab, setSearchTab] = useState<"standard" | "natural">("standard");
  const [datesOpen, setDatesOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const datesRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      const t = e.target as Node;
      if (datesRef.current && !datesRef.current.contains(t)) setDatesOpen(false);
      if (guestsRef.current && !guestsRef.current.contains(t)) setGuestsOpen(false);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleSearchClick = useCallback(async () => {
    const code = parseListingCodeFromSearchQuery(draft.location);
    if (code) {
      try {
        const res = await fetch(`/api/listings/resolve-code?code=${encodeURIComponent(code)}`);
        const data = (await res.json()) as { url?: string };
        if (res.ok && data.url) {
          router.push(data.url);
          return;
        }
      } catch {
        /* fall through */
      }
      router.push(`/listings/not-found?code=${encodeURIComponent(code)}`);
      return;
    }
    apply();
  }, [apply, draft.location, router]);

  const rangeLabel =
    draft.checkIn && draft.checkOut
      ? `${fmtDateShort(draft.checkIn)} — ${fmtDateShort(draft.checkOut)}`
      : "Add dates";

  const g = draft.guests ?? 2;
  const guestLabel = `${g} guest${g !== 1 ? "s" : ""}`;

  const entireChecked = draft.roomType === "Entire place";

  return (
    <div className="rounded-md bg-white p-3 shadow-xl ring-4 ring-[#D4AF37] ring-offset-2 ring-offset-[#0b1d3a] sm:p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSearchTab("standard")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            searchTab === "standard" ? "bg-white text-[#0b1d3a] shadow" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Standard search
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchTab("natural");
            setTimeout(() => document.getElementById("stays-smart-search")?.scrollIntoView({ behavior: "smooth" }), 50);
          }}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            searchTab === "natural" ? "bg-white text-[#0b1d3a] shadow" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Search in your own words
        </button>
      </div>

      <div className="flex flex-col divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 sm:flex-row sm:divide-x sm:divide-y-0">
        <div className="relative flex min-h-[52px] min-w-0 flex-1 items-center gap-2 px-3 py-2 sm:py-0">
          <label htmlFor={destinationFieldId} className="sr-only">
            Destination — city, region, or listing code
          </label>
          <Bed className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
          <input
            id={destinationFieldId}
            type="text"
            value={draft.location}
            onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
            placeholder="City, region, or listing code (LST-…)"
            autoComplete="address-level2"
            className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
          {draft.location ? (
            <button
              type="button"
              aria-label="Clear destination"
              onClick={() => setDraft((d) => ({ ...d, location: "" }))}
              className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="relative min-h-[52px] min-w-[200px] shrink-0" ref={datesRef}>
          <button
            type="button"
            onClick={() => {
              setDatesOpen((o) => !o);
              setGuestsOpen(false);
            }}
            className={`flex h-full w-full items-center gap-2 px-3 py-2 text-left sm:py-0 ${
              datesOpen ? "bg-sky-50" : "hover:bg-slate-50"
            }`}
          >
            <Calendar className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
            <span className="text-sm font-medium text-slate-900">{rangeLabel}</span>
            <ChevronDown className="ml-auto h-4 w-4 text-slate-400" aria-hidden />
          </button>
          {datesOpen ? (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-slate-200 bg-white p-3 shadow-xl sm:left-auto sm:min-w-[320px]">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-slate-600">
                  Check-in
                  <input
                    type="date"
                    value={draft.checkIn ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, checkIn: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Check-out
                  <input
                    type="date"
                    value={draft.checkOut ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, checkOut: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Tip: ± flexibility is available in Filters after you search.</p>
            </div>
          ) : null}
        </div>

        <div className="relative min-h-[52px] min-w-[200px] shrink-0" ref={guestsRef}>
          <button
            type="button"
            onClick={() => {
              setGuestsOpen((o) => !o);
              setDatesOpen(false);
            }}
            className={`flex h-full w-full items-center gap-2 px-3 py-2 text-left sm:py-0 ${
              guestsOpen ? "bg-sky-50" : "hover:bg-slate-50"
            }`}
          >
            <Users className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
            <span className="text-sm font-medium text-slate-900">{guestLabel}</span>
            <ChevronDown className="ml-auto h-4 w-4 text-slate-400" aria-hidden />
          </button>
          {guestsOpen ? (
            <div className="absolute right-0 top-full z-30 mt-1 w-[260px] rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
              <p className="text-xs font-medium text-slate-600">Guests</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="rounded-md border border-slate-200 px-3 py-1 text-lg leading-none"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      guests: Math.max(1, (d.guests ?? 2) - 1),
                    }))
                  }
                >
                  −
                </button>
                <span className="text-lg font-semibold tabular-nums">{draft.guests ?? 2}</span>
                <button
                  type="button"
                  className="rounded-md border border-slate-200 px-3 py-1 text-lg leading-none"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      guests: Math.min(16, (d.guests ?? 2) + 1),
                    }))
                  }
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="mt-3 w-full rounded-md bg-[#0b1d3a] py-2 text-sm font-semibold text-white hover:bg-[#0a1934]"
                onClick={() => setGuestsOpen(false)}
              >
                Done
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 p-2 sm:border-t-0 sm:border-l sm:p-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Filters
            {activeFilterCount > 0 ? (
              <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#D4AF37]/25 px-1 text-[11px] font-bold text-slate-900">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => void handleSearchClick()}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md bg-[#006ce4] px-6 text-sm font-bold text-white hover:bg-[#0057b8] sm:flex-initial"
          >
            <Search className="h-4 w-4 sm:hidden" aria-hidden />
            Search
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={entireChecked}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                roomType: e.target.checked ? "Entire place" : "",
              }))
            }
            className="h-4 w-4 rounded border-slate-300 text-[#006ce4] focus:ring-[#006ce4]"
          />
          Entire home or apartment
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="w-full text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:w-auto sm:mr-2">
          Nightly budget
        </span>
        {STAY_PRICE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPricePresetStays(p.id)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              pricePresetId === p.id
                ? "border-[#D4AF37] bg-[#D4AF37]/15 text-slate-900"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StaysBookingInner({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLinks
        links={[
          { href: "#stays-search-main", label: "Skip to search" },
          { href: "#stays-results", label: "Skip to results" },
        ]}
      />
      <header className="border-b border-white/10 bg-[#0b1d3a]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <BrandLogo variant="default" href="/bnhub" />
          <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  item.active ? "bg-white/15 text-white ring-1 ring-white/40" : "text-white/80 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/bnhub/host/dashboard"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-amber-200/90 hover:text-amber-100"
            >
              List your property
            </Link>
            <Link
              href="/bnhub/login"
              className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-slate-950 hover:brightness-110"
            >
              Sign in
            </Link>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            {[
              { icon: Bed, label: "Stays & hotels" },
              { icon: Bed, label: "Motels & inns", muted: true },
            ].map((row, i) => (
              <div
                key={i}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
                  i === 0 ? "bg-white/15 text-white ring-1 ring-white/30" : "text-white/50"
                }`}
              >
                <row.icon className="h-4 w-4" aria-hidden />
                {row.label}
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="bg-[#0b1d3a] pb-28 pt-8 text-white sm:pb-32 sm:pt-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-medium text-[#D4AF37]">{PLATFORM_NAME}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">Where to next?</h1>
          <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">
            Search short-term stays, boutique hotels, and motels — verified hosts when you need extra confidence.
          </p>
        </div>
      </section>

      <div
        id="stays-search-main"
        className="relative z-20 mx-auto -mt-20 max-w-5xl scroll-mt-24 px-4 sm:-mt-24 sm:px-6"
      >
        <nav aria-label="Stay search" className="relative z-[60]">
          <SearchEngineBar customBar={<BookingStaysHeroBar />} />
        </nav>
      </div>

      <div className="bg-slate-50 pb-10 pt-8">
        <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Offers</h2>
            <p className="mt-1 text-sm text-slate-600">Promotions and featured stays for you</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
          </section>

          <section
            id="stays-results"
            aria-label="Search results"
            className="scroll-mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
          >
            <h2 className="text-lg font-bold text-slate-900">Browse &amp; book</h2>
            <p className="text-sm text-slate-600">Results update when you search. Map and lifestyle filters are below.</p>
            <div className="mt-4">
              <StaysSearchResults />
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <Link href="/bnhub" className="text-[#006ce4] hover:underline">
          BNHub home
        </Link>
        <span className="mx-2">·</span>
        <Link href="/legal/privacy" className="hover:underline">
          Privacy
        </Link>
      </footer>
    </>
  );
}

/**
 * Guest-facing stays discovery — Booking.com-style layout (search strip, offers, results) with Prestige / LECIPM branding.
 * Pass server-rendered cards as `children` (e.g. featured listings).
 */
export function StaysGuestBookingDashboard({ children }: { children?: ReactNode }) {
  return (
    <SearchFiltersProvider mode="short">
      <BnhubStaysQuerySync />
      <div className="min-h-screen bg-white text-slate-900">
        <StaysBookingInner>{children}</StaysBookingInner>
      </div>
    </SearchFiltersProvider>
  );
}
