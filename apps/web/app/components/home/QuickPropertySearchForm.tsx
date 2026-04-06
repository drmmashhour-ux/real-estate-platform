"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import {
  DEFAULT_GLOBAL_FILTERS,
  globalFiltersToUrlParams,
  type GlobalSearchFiltersExtended,
} from "@/components/search/FilterState";
import {
  parseVoiceQuery,
  voiceFeedbackEnglish,
  voiceParseHasSignal,
  type ParsedVoiceQuery,
} from "@/lib/search/parseVoiceQuery";
import { isSpeechRecognitionSupported, startVoiceSearch } from "@/lib/search/voiceSearch";

type Segment = "" | "residential" | "for-rent" | "commercial";

function filtersFromInputs(
  location: string,
  priceMinRaw: string,
  priceMaxRaw: string,
  segment: Segment,
  bedroomsRaw: string
): GlobalSearchFiltersExtended {
  const priceMin = Math.max(0, Number.parseInt(priceMinRaw, 10) || 0);
  const priceMax = Math.max(0, Number.parseInt(priceMaxRaw, 10) || 0);
  const bedN = Number.parseInt(bedroomsRaw, 10);
  const bedrooms = bedroomsRaw !== "" && Number.isFinite(bedN) && bedN >= 0 ? bedN : null;

  const base: GlobalSearchFiltersExtended = {
    ...DEFAULT_GLOBAL_FILTERS,
    location: location.trim(),
    priceMin,
    priceMax,
    bedrooms,
  };

  switch (segment) {
    case "residential":
      return { ...base, type: "residential" };
    case "for-rent":
      return { ...base, type: "rent", rentListingCategory: "residential" };
    case "commercial":
      return { ...base, type: "commercial" };
    default:
      return { ...base, type: "buy" };
  }
}

function mergeVoiceParsedIntoFilters(
  f: GlobalSearchFiltersExtended,
  parsed: ParsedVoiceQuery
): GlobalSearchFiltersExtended {
  let next: GlobalSearchFiltersExtended = { ...f };
  if (parsed.segment === "commercial") {
    next = { ...next, propertyTypes: [], propertyType: "COMMERCIAL" };
    return next;
  }
  if (parsed.propertyTypes?.length) {
    next = { ...next, propertyTypes: [...parsed.propertyTypes], propertyType: "" };
  }
  return next;
}

export type QuickPropertySearchVariant = "dark" | "portal" | "hero";

export function QuickPropertySearchForm({ variant = "dark" }: { variant?: QuickPropertySearchVariant }) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [segment, setSegment] = useState<Segment>("");
  const [voiceQuery, setVoiceQuery] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceStopRef = useRef<{ stop: () => void } | null>(null);
  const hero = variant === "hero";
  const portal = variant === "portal" || hero;

  useEffect(() => {
    return () => {
      voiceStopRef.current?.stop();
    };
  }, []);

  const runVoicePipeline = useCallback(
    (transcript: string) => {
      setVoiceQuery(transcript);
      setVoiceError(null);
      const parsed = parseVoiceQuery(transcript);
      if (!voiceParseHasSignal(parsed)) {
        setVoiceError('Try saying: "2 bedroom apartment in Montreal under 600 thousand"');
        return;
      }

      const nextLocation = parsed.city?.trim() ? parsed.city.trim() : location;
      const nextMin =
        parsed.minPrice != null && parsed.minPrice > 0 ? String(parsed.minPrice) : minPrice;
      const nextMax =
        parsed.maxPrice != null && parsed.maxPrice > 0 ? String(parsed.maxPrice) : maxPrice;
      const nextBeds = parsed.beds != null ? String(parsed.beds) : bedrooms;
      const nextSegment = parsed.segment !== "" ? parsed.segment : segment;

      setLocation(nextLocation);
      setMinPrice(nextMin);
      setMaxPrice(nextMax);
      setBedrooms(nextBeds);
      setSegment(nextSegment);

      const base = filtersFromInputs(nextLocation, nextMin, nextMax, nextSegment, nextBeds);
      const merged = mergeVoiceParsedIntoFilters(base, parsed);
      const qs = globalFiltersToUrlParams(merged).toString();
      router.push(qs ? `/search?${qs}` : "/search");

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(voiceFeedbackEnglish(parsed));
        u.lang = "en-CA";
        u.rate = 0.95;
        window.setTimeout(() => window.speechSynthesis.speak(u), 120);
      }
    },
    [location, minPrice, maxPrice, bedrooms, segment, router]
  );

  const onMicClick = useCallback(() => {
    setVoiceError(null);
    if (!isSpeechRecognitionSupported()) {
      setVoiceError("Voice search is not available in this browser. Try Chrome or Edge on desktop or Android.");
      return;
    }
    voiceStopRef.current?.stop();
    const ctrl = startVoiceSearch({
      onTranscript: (text) => runVoicePipeline(text),
      onError: (msg) => {
        if (msg) setVoiceError(msg);
      },
      onListeningChange: (v) => setVoiceListening(v),
    });
    voiceStopRef.current = ctrl;
  }, [runVoicePipeline]);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const f = filtersFromInputs(location, minPrice, maxPrice, segment, bedrooms);
      const qs = globalFiltersToUrlParams(f).toString();
      router.push(qs ? `/search?${qs}` : "/search");
    },
    [location, minPrice, maxPrice, segment, bedrooms, router]
  );

  const cardClass = hero
    ? "relative w-full"
    : portal
      ? "relative mx-auto w-full max-w-md rounded-2xl border border-white/15 bg-black/45 p-5 shadow-xl shadow-black/50 backdrop-blur-md sm:p-6 lg:max-w-md"
      : "relative mx-auto w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl shadow-slate-950/60 backdrop-blur sm:p-6 lg:max-w-sm";

  const labelClass = hero ? "sr-only" : portal ? "text-slate-300" : "text-slate-300";
  const inputClass = portal
    ? hero
      ? "w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3.5 text-base text-white placeholder:text-white/50 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
      : "w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
    : "w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40";
  const selectClass = portal
    ? hero
      ? "w-full rounded-xl border border-white/10 bg-black/50 px-3 py-3.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
      : "w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
    : "w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40";

  return (
    <div className={cardClass}>
      {hero ? (
        <h2 className="sr-only">Search properties</h2>
      ) : (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className={`text-sm font-semibold ${portal ? "text-white" : "text-slate-100"}`}>
            Property search
          </h2>
          <span
            className={
              portal
                ? "rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[#D4AF37]"
                : "rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-300"
            }
          >
            Québec
          </span>
        </div>
      )}
      <form onSubmit={onSubmit} className={hero ? "" : "space-y-4"}>
        {hero ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="quick-city" className={labelClass}>
                City or region
              </label>
              <div className="relative">
                <input
                  id="quick-city"
                  name="city"
                  type="text"
                  value={location}
                  onChange={(ev) => setLocation(ev.target.value)}
                  placeholder="City, neighbourhood, or region"
                  autoComplete="address-level2"
                  className={`${inputClass} pr-14`}
                  aria-describedby="quick-voice-status"
                />
                <button
                  type="button"
                  onClick={onMicClick}
                  disabled={voiceListening}
                  aria-label={voiceListening ? "Listening for your search" : "Search by voice — speak your criteria"}
                  aria-pressed={voiceListening}
                  className={[
                    "absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-black/40 text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.15)] transition hover:shadow-[0_0_24px_rgba(212,175,55,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                    voiceListening ? "animate-pulse" : "",
                    voiceListening ? "cursor-wait opacity-90" : "hover:bg-[#D4AF37]/10",
                  ].join(" ")}
                >
                  <Mic className="h-5 w-5" strokeWidth={2} aria-hidden />
                </button>
              </div>
              <p id="quick-voice-status" className="sr-only" aria-live="polite">
                {voiceListening ? "Listening" : voiceQuery ? `Heard: ${voiceQuery}` : ""}
              </p>
              {voiceListening ? (
                <p className="mt-1.5 text-xs font-medium text-[#D4AF37]" aria-live="polite">
                  Listening… speak now
                </p>
              ) : null}
              {voiceError ? (
                <p className="mt-1.5 text-xs text-amber-200/90" role="alert">
                  {voiceError}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="quick-minPrice" className={labelClass}>
                  Minimum price
                </label>
                <input
                  id="quick-minPrice"
                  name="minPrice"
                  type="number"
                  min={0}
                  step={10000}
                  value={minPrice}
                  onChange={(ev) => setMinPrice(ev.target.value)}
                  placeholder="Minimum $"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="quick-maxPrice" className={labelClass}>
                  Maximum price
                </label>
                <input
                  id="quick-maxPrice"
                  name="maxPrice"
                  type="number"
                  min={0}
                  step={10000}
                  value={maxPrice}
                  onChange={(ev) => setMaxPrice(ev.target.value)}
                  placeholder="Maximum $"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="quick-segment" className={labelClass}>
                  Property type
                </label>
                <select
                  id="quick-segment"
                  name="segment"
                  value={segment}
                  onChange={(ev) => setSegment(ev.target.value as Segment)}
                  className={selectClass}
                >
                  <option value="">All types</option>
                  <option value="residential">Residential (sale)</option>
                  <option value="for-rent">For rent</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label htmlFor="quick-bedrooms" className={labelClass}>
                  Bedrooms
                </label>
                <select
                  id="quick-bedrooms"
                  name="bedrooms"
                  value={bedrooms}
                  onChange={(ev) => setBedrooms(ev.target.value)}
                  className={selectClass}
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#D4AF37] px-3 py-3.5 text-base font-semibold text-black shadow-[0_8px_30px_rgba(212,175,55,0.35)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(212,175,55,0.5)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Find properties fast
              </button>
            </div>
            <a
              href="/search"
              className="mt-3 block text-center text-sm text-white/70 underline hover:text-[#D4AF37]"
            >
              Advanced search
            </a>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="quick-city" className={`mb-1 block text-xs font-medium ${labelClass}`}>
                City or region
              </label>
              <div className="relative">
                <input
                  id="quick-city"
                  name="city"
                  type="text"
                  value={location}
                  onChange={(ev) => setLocation(ev.target.value)}
                  placeholder="e.g. Montreal, Laval, Québec"
                  autoComplete="address-level2"
                  className={`${inputClass} pr-14`}
                  aria-describedby="quick-voice-status-portal"
                />
                <button
                  type="button"
                  onClick={onMicClick}
                  disabled={voiceListening}
                  aria-label={voiceListening ? "Listening for your search" : "Search by voice — speak your criteria"}
                  aria-pressed={voiceListening}
                  className={[
                    "absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-black/40 text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.15)] transition hover:shadow-[0_0_24px_rgba(212,175,55,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                    voiceListening ? "animate-pulse" : "",
                    voiceListening ? "cursor-wait opacity-90" : "hover:bg-[#D4AF37]/10",
                  ].join(" ")}
                >
                  <Mic className="h-5 w-5" strokeWidth={2} aria-hidden />
                </button>
              </div>
              <p id="quick-voice-status-portal" className="sr-only" aria-live="polite">
                {voiceListening ? "Listening" : voiceQuery ? `Heard: ${voiceQuery}` : ""}
              </p>
              {voiceListening ? (
                <p className="mt-1.5 text-xs font-medium text-[#D4AF37]" aria-live="polite">
                  Listening… speak now
                </p>
              ) : null}
              {voiceError ? (
                <p className="mt-1.5 text-xs text-amber-300" role="alert">
                  {voiceError}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="quick-minPrice" className={`mb-1 block text-xs font-medium ${labelClass}`}>
                  Min. price
                </label>
                <input
                  id="quick-minPrice"
                  name="minPrice"
                  type="number"
                  min={0}
                  step={10000}
                  value={minPrice}
                  onChange={(ev) => setMinPrice(ev.target.value)}
                  placeholder="Minimum $"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="quick-maxPrice" className={`mb-1 block text-xs font-medium ${labelClass}`}>
                  Max. price
                </label>
                <input
                  id="quick-maxPrice"
                  name="maxPrice"
                  type="number"
                  min={0}
                  step={10000}
                  value={maxPrice}
                  onChange={(ev) => setMaxPrice(ev.target.value)}
                  placeholder="Maximum $"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="quick-segment" className={`mb-1 block text-xs font-medium ${labelClass}`}>
                  Category
                </label>
                <select
                  id="quick-segment"
                  name="segment"
                  value={segment}
                  onChange={(ev) => setSegment(ev.target.value as Segment)}
                  className={selectClass}
                >
                  <option value="">For sale — all</option>
                  <option value="residential">Residential (sale)</option>
                  <option value="for-rent">For rent</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label htmlFor="quick-bedrooms" className={`mb-1 block text-xs font-medium ${labelClass}`}>
                  Min. bedrooms
                </label>
                <select
                  id="quick-bedrooms"
                  name="bedrooms"
                  value={bedrooms}
                  onChange={(ev) => setBedrooms(ev.target.value)}
                  className={selectClass}
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className={
                portal
                  ? "flex w-full items-center justify-center rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-black shadow-md shadow-black/30 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  : "flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              }
            >
              Search
            </button>
          </>
        )}
      </form>

      {!hero ? (
        <div className={`mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] ${portal ? "text-slate-400" : "text-slate-400"}`}>
          <span>Listings on LECIPM — verified sellers &amp; brokers</span>
          <span
            className={
              portal
                ? "rounded-full border border-white/10 bg-black/40 px-2 py-1 text-slate-300"
                : "rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300"
            }
          >
            Updated daily
          </span>
        </div>
      ) : null}
      {portal && !hero ? (
        <p className="mt-3 border-t border-white/10 pt-3 text-center">
          <Link
            href="/search"
            className="text-xs font-medium text-[#D4AF37] underline decoration-[#D4AF37]/40 underline-offset-2 hover:decoration-[#D4AF37]"
          >
            Advanced search — full filters &amp; comparison
          </Link>
        </p>
      ) : null}
    </div>
  );
}
