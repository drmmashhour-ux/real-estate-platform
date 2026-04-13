"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  Bed,
  Calendar,
  ChevronDown,
  Compass,
  Plane,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  BnHubHeaderMark,
  BNHUB_GUEST_TAGLINE_LINE1,
  BNHUB_GUEST_TAGLINE_LINE2,
  BNHUB_REASSURANCE_LINE,
} from "@/components/bnhub/BnHubHeaderMark";
import { BnHubLogoMark } from "@/components/bnhub/BnHubLogoMark";
import { BNHUB_LOGO_SRC } from "@/lib/brand/bnhub-logo";
import { BnhubGuestNavMenu } from "@/components/bnhub/BnhubGuestNavMenu";
import { BnhubLoyaltyRibbon } from "@/components/bnhub/BnhubLoyaltyRibbon";
import { SearchEngineBar, SearchFiltersProvider, useSearchEngineContext } from "@/components/search/SearchEngine";
import { STAY_PRICE_PRESETS } from "@/components/search/SearchBar";
import { parseListingCodeFromSearchQuery } from "@/lib/listing-code-public";
import { StaysSearchResults } from "@/app/bnhub/stays/stays-search-client";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { BnhubStripeTrustHint } from "@/components/bnhub/BnhubStripeTrustHint";
import { BnhubStaysQuerySync } from "@/components/bnhub/BnhubStaysQuerySync";
import { PUBLIC_MAP_SEARCH_URL } from "@/lib/search/public-map-search-urls";
import { BnhubMobileTabBar } from "@/components/bnhub/BnhubMobileTabBar";

const DISCOVERY = [
  { label: "Montréal", city: "Montreal" },
  { label: "Québec City", city: "Quebec" },
  { label: "Gatineau", city: "Gatineau" },
  { label: "Sherbrooke", city: "Sherbrooke" },
  { label: "Trois-Rivières", city: "Trois-Rivieres" },
] as const;

/** BNHUB guest mode chips — short stays & travel only; long-term rent & buy live under Immobilier / platform nav. */
const MODE_ROW = [
  { label: "BNHUB", href: "/bnhub", brandLogo: true as const, activeWhen: "home" as const },
  { label: "Stays", href: PUBLIC_MAP_SEARCH_URL.bnhubStays, activeWhen: "stays" as const },
  { label: "Trips", href: "/bnhub/trips", icon: Plane, activeWhen: null },
  { label: "Travel AI", href: "/bnhub/travel/compare", icon: Sparkles, activeWhen: null },
] as const;

function fmtDateShort(iso: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function SuggestedCitiesStrip() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-premium-gold/15 pt-6">
      <span className="flex w-full items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-premium-gold/70 sm:w-auto sm:pr-2">
        <Compass className="h-3.5 w-3.5 text-premium-gold" aria-hidden />
        Suggested
      </span>
      {DISCOVERY.map((d) => (
        <Link
          key={d.city}
          href={`/bnhub/stays?city=${encodeURIComponent(d.city)}`}
          className="inline-flex min-h-[40px] items-center rounded-full border border-premium-gold/40 bg-black/40 px-4 py-2 text-sm font-medium text-premium-gold backdrop-blur-sm transition hover:border-premium-gold hover:bg-premium-gold/15"
        >
          {d.label}
        </Link>
      ))}
    </div>
  );
}

function DefaultPrestigeHero() {
  return (
    <section className="border-b border-premium-gold/20 bg-black py-8 md:py-12">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <div className="flex justify-center">
          <BnHubLogoMark size="lg" priority className="max-w-[min(100%,280px)] sm:!h-14" />
        </div>
        <div className="mt-3 space-y-1 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400 sm:text-sm">
            {BNHUB_GUEST_TAGLINE_LINE1}
          </p>
          <p className="font-serif text-sm font-semibold uppercase tracking-[0.22em] text-neutral-300 sm:text-base">
            {BNHUB_GUEST_TAGLINE_LINE2}
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-premium-gold sm:text-4xl lg:text-5xl">Where to next?</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-premium-gold/80 sm:text-base">
          Search with filters and map — listing codes appear on every card so you always know which property you are viewing.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-[11px] font-normal leading-snug text-premium-gold/45 sm:text-xs sm:text-premium-gold/50">
          {BNHUB_REASSURANCE_LINE}
        </p>
        <BnhubStripeTrustHint className="mx-auto mt-5 max-w-xl" variant="prominent" tone="dark" />
      </div>
    </section>
  );
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
    <div className="overflow-hidden rounded-xl border border-premium-gold/35 bg-neutral-950 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
      <div className="flex flex-wrap gap-2 border-b border-premium-gold/15 bg-black px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => setSearchTab("standard")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            searchTab === "standard"
              ? "bg-premium-gold text-[#0a0a0a] shadow"
              : "text-premium-gold/80 hover:bg-white/5"
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
            searchTab === "natural"
              ? "bg-premium-gold text-[#0a0a0a] shadow"
              : "text-premium-gold/80 hover:bg-white/5"
          }`}
        >
          Search in your own words
        </button>
      </div>

      <div className="bg-[#0a0a0a] p-3 sm:p-4">
        <div className="flex flex-col divide-y divide-premium-gold/15 overflow-hidden rounded-lg border border-premium-gold/25 bg-[#121212] sm:flex-row sm:divide-x sm:divide-y-0">
          <div className="relative flex min-h-[52px] min-w-0 flex-1 items-center gap-2 px-3 py-2 sm:py-0">
            <label htmlFor={destinationFieldId} className="sr-only">
              Destination — city, region, or listing code
            </label>
            <Bed className="h-5 w-5 shrink-0 text-premium-gold/70" aria-hidden />
            <input
              id={destinationFieldId}
              type="text"
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              placeholder="City, region, or listing code (LST-…)"
              autoComplete="address-level2"
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-0"
            />
            {draft.location ? (
              <button
                type="button"
                aria-label="Clear destination"
                onClick={() => setDraft((d) => ({ ...d, location: "" }))}
                className="shrink-0 rounded-full p-1 text-neutral-500 hover:bg-white/10 hover:text-premium-gold"
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
                datesOpen ? "bg-premium-gold/10" : "hover:bg-white/5"
              }`}
            >
              <Calendar className="h-5 w-5 shrink-0 text-premium-gold/70" aria-hidden />
              <span className="text-sm font-medium text-neutral-100">{rangeLabel}</span>
              <ChevronDown className="ml-auto h-4 w-4 text-neutral-500" aria-hidden />
            </button>
            {datesOpen ? (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-premium-gold/25 bg-[#141414] p-3 shadow-xl sm:left-auto sm:min-w-[320px]">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-neutral-400">
                    Check-in
                    <input
                      type="date"
                      value={draft.checkIn ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, checkIn: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-premium-gold/25 bg-[#1a1a1a] px-2 py-1.5 text-sm text-neutral-100"
                    />
                  </label>
                  <label className="text-xs text-neutral-400">
                    Check-out
                    <input
                      type="date"
                      value={draft.checkOut ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, checkOut: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-premium-gold/25 bg-[#1a1a1a] px-2 py-1.5 text-sm text-neutral-100"
                    />
                  </label>
                </div>
                <p className="mt-2 text-[11px] text-neutral-500">Tip: ± flexibility is available in Filters after you search.</p>
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
                guestsOpen ? "bg-premium-gold/10" : "hover:bg-white/5"
              }`}
            >
              <Users className="h-5 w-5 shrink-0 text-premium-gold/70" aria-hidden />
              <span className="text-sm font-medium text-neutral-100">{guestLabel}</span>
              <ChevronDown className="ml-auto h-4 w-4 text-neutral-500" aria-hidden />
            </button>
            {guestsOpen ? (
              <div className="absolute right-0 top-full z-30 mt-1 w-[260px] rounded-lg border border-premium-gold/25 bg-[#141414] p-4 shadow-xl">
                <p className="text-xs font-medium text-neutral-400">Guests</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="rounded-md border border-premium-gold/30 px-3 py-1 text-lg leading-none text-neutral-200 hover:bg-premium-gold/10"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        guests: Math.max(1, (d.guests ?? 2) - 1),
                      }))
                    }
                  >
                    −
                  </button>
                  <span className="text-lg font-semibold tabular-nums text-neutral-100">{draft.guests ?? 2}</span>
                  <button
                    type="button"
                    className="rounded-md border border-premium-gold/30 px-3 py-1 text-lg leading-none text-neutral-200 hover:bg-premium-gold/10"
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
                  className="mt-3 w-full rounded-md bg-premium-gold py-2 text-sm font-semibold text-[#0a0a0a] hover:brightness-110"
                  onClick={() => setGuestsOpen(false)}
                >
                  Done
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-premium-gold/15 p-2 sm:border-t-0 sm:border-l sm:p-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="rounded-md border border-premium-gold/35 px-3 py-2 text-sm font-semibold text-neutral-200 hover:border-premium-gold/55 hover:bg-premium-gold/5"
            >
              Filters
              {activeFilterCount > 0 ? (
                <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-premium-gold/25 px-1 text-[11px] font-bold text-[#0a0a0a]">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => void handleSearchClick()}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md bg-[#d4af37] px-6 text-sm font-bold text-[#0a0a0a] hover:brightness-110 sm:flex-initial"
            >
              <Search className="h-4 w-4 sm:hidden" aria-hidden />
              Search
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={entireChecked}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  roomType: e.target.checked ? "Entire place" : "",
                }))
              }
              className="h-4 w-4 rounded border-neutral-600 bg-[#1a1a1a] text-premium-gold focus:ring-premium-gold"
            />
            Entire home or apartment
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="w-full text-[11px] font-semibold uppercase tracking-wide text-premium-gold/70 sm:mr-2 sm:w-auto">
            Nightly budget
          </span>
          {STAY_PRICE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPricePresetStays(p.id)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                pricePresetId === p.id
                  ? "border-premium-gold bg-premium-gold/15 text-premium-gold"
                  : "border-premium-gold/25 text-neutral-400 hover:border-premium-gold/45 hover:text-neutral-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <BnhubStripeTrustHint className="mt-3 w-full max-w-xl sm:text-left" variant="prominent" tone="dark" />
      </div>
    </div>
  );
}

function StaysBookingInner({
  children,
  heroSlot,
  beforeOffers,
  bottomSlot,
  activeMode,
}: {
  children: ReactNode;
  /** Omit for default prestige hero; pass `null` to hide the hero entirely (e.g. `/bnhub` home). */
  heroSlot?: ReactNode | null;
  beforeOffers?: ReactNode;
  bottomSlot?: ReactNode;
  activeMode: "home" | "stays";
}) {
  const resolvedHero = heroSlot === undefined ? <DefaultPrestigeHero /> : heroSlot;
  /** Keep search below hero reel hit area (was -mt-20 and blocked play clicks). */
  const searchPullClass = resolvedHero ? "-mt-8 sm:-mt-10" : "mt-0 pt-4 sm:pt-6";

  return (
    <>
      <SkipLinks
        links={[
          { href: "#stays-search-main", label: "Skip to search" },
          { href: "#stays-results", label: "Skip to results" },
        ]}
      />
      <header className="sticky top-0 z-40 border-b border-premium-gold/20 bg-black/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <BnHubHeaderMark showLogo={false} />
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <BnhubLoyaltyRibbon />
            <Link
              href="/bnhub/find-reservation"
              className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-premium-gold hover:bg-white/5 sm:inline-flex"
            >
              Reservation code
            </Link>
            <Link
              href="/dashboard/bnhub"
              className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-premium-gold hover:bg-white/5 sm:inline-flex"
            >
              Client dashboard
            </Link>
            <Link
              href="/bnhub/host/dashboard"
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-premium-gold hover:bg-white/5 md:inline-flex"
            >
              Host dashboard
            </Link>
            <BnhubGuestNavMenu variant="dark" />
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/80">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 [scrollbar-width:none]">
            {MODE_ROW.map((item) => {
              const emphasized = item.activeWhen != null && item.activeWhen === activeMode;
              const isBrand = "brandLogo" in item && item.brandLogo;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={isBrand ? "BNHUB home" : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    emphasized
                      ? "bg-premium-gold text-[#0a0a0a] shadow-lg shadow-premium-gold/15"
                      : "border border-premium-gold/35 text-premium-gold hover:border-premium-gold/60 hover:bg-premium-gold/10"
                  }`}
                >
                  {isBrand ? (
                    <BnHubLogoMark
                      decorative
                      src={BNHUB_LOGO_SRC}
                      size="xs"
                      className={`!h-[20px] max-h-[20px] w-auto max-w-[104px] object-contain object-left sm:!h-6 sm:max-h-6 sm:max-w-[120px] ${emphasized ? "opacity-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" : "opacity-90"}`}
                    />
                  ) : (
                    <>
                      {"icon" in item && item.icon ? (
                        <item.icon className="h-4 w-4 opacity-90" aria-hidden />
                      ) : null}
                      {item.label}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {resolvedHero}

      <div
        id="stays-search-main"
        className={`relative z-20 mx-auto max-w-5xl scroll-mt-24 px-4 sm:px-6 pointer-events-none ${searchPullClass}`}
      >
        <nav aria-label="Stay search" className="relative z-[60] pointer-events-auto">
          <SearchEngineBar customBar={<BookingStaysHeroBar />} />
        </nav>
        <div className="pointer-events-auto">
          <SuggestedCitiesStrip />
        </div>
      </div>

      <div className="bg-[#080808] py-8 text-neutral-100 md:py-12">
        <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 md:space-y-10">
          {beforeOffers}

          <section className="rounded-xl border border-premium-gold/20 bg-[#0c0c0c] p-6 shadow-lg">
            <h2 className="text-xl font-bold text-premium-gold">Offers</h2>
            <p className="mt-1 text-sm text-neutral-400">Promotions and featured stays — each card shows its listing code.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
          </section>

          <section
            id="stays-results"
            aria-label="Search results"
            className="scroll-mt-8 rounded-xl border border-premium-gold/20 bg-[#0c0c0c] p-4 shadow-lg md:p-5"
          >
            <h2 className="text-lg font-bold text-premium-gold">Browse &amp; book</h2>
            <p className="text-sm text-neutral-400">
              Filters and map update with your search. Reference any stay by its public listing code.
            </p>
            <div className="mt-4">
              <StaysSearchResults />
            </div>
          </section>

          {bottomSlot}
        </div>
      </div>

      <footer className="lecipm-prestige-band py-10">
        <div className="lecipm-prestige-band__inner mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <BnHubHeaderMark size="footer" />
          <nav aria-label="BNHUB footer" className="w-full max-w-4xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-2">
              {(
                [
                  ["/bnhub", "BNHUB home"],
                  ["/bnhub/find-reservation", "Find reservation"],
                  ["/bnhub/become-host", "List your space"],
                  ["/legal/privacy", "Privacy"],
                ] as const
              ).map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="lecipm-prestige-pill lecipm-neon-white-muted lecipm-touch flex min-h-[52px] w-full shrink-0 items-center justify-center px-5 py-3.5 text-base font-semibold active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-4 sm:py-2 sm:text-xs sm:active:opacity-100 md:text-sm"
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </footer>
    </>
  );
}

/**
 * Guest-facing stays discovery — same full search + filters + map on `/bnhub` and `/bnhub/stays`.
 */
export function StaysGuestBookingDashboard({
  children,
  heroSlot,
  beforeOffers,
  bottomSlot,
  activeMode = "stays",
}: {
  children?: ReactNode;
  heroSlot?: ReactNode | null;
  beforeOffers?: ReactNode;
  bottomSlot?: ReactNode;
  activeMode?: "home" | "stays";
}) {
  return (
    <SearchFiltersProvider mode="short">
      <BnhubStaysQuerySync />
      <div className="min-h-screen bg-[#050505] pb-[4.75rem] text-neutral-100 md:pb-0">
        <StaysBookingInner
          heroSlot={heroSlot}
          beforeOffers={beforeOffers}
          bottomSlot={bottomSlot}
          activeMode={activeMode}
        >
          {children}
        </StaysBookingInner>
        <BnhubMobileTabBar />
      </div>
    </SearchFiltersProvider>
  );
}
