"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DEFAULT_GLOBAL_FILTERS, globalFiltersToUrlParams } from "@/components/search/FilterState";
import { reportProductEvent } from "@/lib/analytics/product-analytics";
import { ProductAnalyticsEvents } from "@/lib/analytics/product-events";
import type { ResolvedExperimentSurface } from "@/lib/experiments/get-variant-config";
import { getTrackingSessionId, track, TrackingEvent } from "@/lib/tracking";

const STAY_CITY_SHORTCUTS = [
  { slug: "Montreal", labelKey: "shortcutMontreal" as const },
  { slug: "Laval", labelKey: "shortcutLaval" as const },
  { slug: "Toronto", labelKey: "shortcutToronto" as const },
] as const;

/**
 * Single above-the-fold search for the marketing home — routes to unified property search.
 */
export function HomePrimarySearch({
  searchExperiment = null,
}: {
  searchExperiment?: ResolvedExperimentSurface | null;
} = {}) {
  const t = useTranslations("home");
  const router = useRouter();
  const [q, setQ] = useState("");
  const searchButton = searchExperiment?.config.searchButton?.trim() || t("searchButton");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const location = q.trim();
    const params = globalFiltersToUrlParams({
      ...DEFAULT_GLOBAL_FILTERS,
      location,
      type: "buy",
    });
    const qs = params.toString();
    reportProductEvent(ProductAnalyticsEvents.SEARCH_USAGE, {
      surface: "home_hero",
      location: location || null,
    });
    const sid = getTrackingSessionId();
    track(TrackingEvent.SEARCH, {
      meta: {
        surface: "home_hero",
        location: location || null,
        type: "buy",
        growthDedupeKey: sid
          ? `search:home:${location || "all"}:${sid}:${Date.now()}`
          : `search:home:${location || "all"}:${Date.now()}`,
      },
      path: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/",
    });
    if (searchExperiment) {
      void fetch("/api/experiments/track", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experimentId: searchExperiment.experimentId,
          variantId: searchExperiment.variantId,
          eventName: "cta_click",
          metadata: { surface: "lecipm_home_search_cta" },
        }),
      }).catch(() => {});
    }
    router.push(qs ? `/search?${qs}` : "/listings");
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center sm:gap-4"
        role="search"
        aria-label={t("searchAria")}
      >
        <label className="sr-only" htmlFor="lecipm-home-search">
          {t("searchLabel")}
        </label>
        <input
          id="lecipm-home-search"
          name="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          className="min-h-[60px] w-full flex-1 rounded-2xl border-2 border-white/15 bg-black/50 px-6 py-4 text-lg text-white shadow-inner shadow-black/40 placeholder:text-white/45 focus:border-[#D4AF37] focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/20 md:min-h-[68px] md:rounded-3xl md:px-8 md:text-xl"
        />
        <button
          type="submit"
          className="lecipm-cta-gold-solid lecipm-touch inline-flex min-h-[60px] w-full shrink-0 items-center justify-center rounded-2xl px-10 text-lg font-semibold shadow-lg sm:w-auto sm:min-w-[180px] md:min-h-[68px] md:rounded-3xl md:px-12 md:text-xl"
        >
          {searchButton}
        </button>
      </form>

      <nav
        className="mt-6 text-center"
        aria-label={t("cityShortcutsAria")}
      >
        <p className="text-xs leading-relaxed text-white/50 sm:text-sm sm:text-white/60">
          <span className="text-white/55">{t("exploreStaysIntro")}</span>{" "}
          {STAY_CITY_SHORTCUTS.map((c, i) => (
            <span key={c.slug}>
              {i > 0 ? <span className="text-white/35"> · </span> : null}
              <Link
                href={`/bnhub/stays?city=${encodeURIComponent(c.slug)}`}
                className="font-semibold text-[#D4AF37] underline-offset-[3px] transition hover:text-[#e8c85c] hover:underline"
                onClick={() =>
                  reportProductEvent(ProductAnalyticsEvents.SEARCH_USAGE, {
                    surface: "home_city_shortcut",
                    location: c.slug,
                  })
                }
              >
                {t(c.labelKey)}
              </Link>
            </span>
          ))}
          <span className="text-white/40" aria-hidden>
            {" "}
            …
          </span>
        </p>
      </nav>
    </div>
  );
}
