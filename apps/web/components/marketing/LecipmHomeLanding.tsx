"use client";

import { useTranslations } from "next-intl";
import { HomeConversionCtas } from "@/components/marketing/HomeConversionCtas";
import { HomePrimarySearch } from "@/components/marketing/HomePrimarySearch";
import { JourneyLandingBeacon } from "@/components/journey/JourneyLandingBeacon";
import { ExperimentExposureTracker } from "@/components/experiments/ExperimentExposureTracker";
import type { ResolvedExperimentSurface } from "@/lib/experiments/get-variant-config";
import { conversionEngineFlags } from "@/config/feature-flags";
import { ConversionHomeBoost } from "@/components/conversion/ConversionHomeBoost";

/**
 * Marketing home top: [Hero] → [Search] as stacked sections (featured + trust follow in `page.tsx`).
 */
export function LecipmHomeLanding({
  heroExperiment = null,
  searchExperiment = null,
}: {
  heroExperiment?: ResolvedExperimentSurface | null;
  searchExperiment?: ResolvedExperimentSurface | null;
} = {}) {
  const t = useTranslations("home");
  const headline = heroExperiment?.config.headline?.trim() || t("headline");
  const subhead = heroExperiment?.config.subhead?.trim() || t("subhead");
  const trackSurfaces = [heroExperiment, searchExperiment].filter(Boolean) as ResolvedExperimentSurface[];

  return (
    <div className="flex flex-col bg-black text-white">
      <ExperimentExposureTracker
        surfaces={trackSurfaces.map((s) => ({ experimentId: s.experimentId, variantId: s.variantId }))}
        eventName="page_view"
      />
      <JourneyLandingBeacon />
      <section
        id="home-hero"
        aria-labelledby="home-headline"
        className="relative overflow-hidden bg-gradient-to-b from-[#1e1b4b] via-[#0f172a] to-black pb-8 pt-12 md:pb-10 md:pt-16"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgb(212 175 55 / 0.35), transparent)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6">
          <h1
            id="home-headline"
            className="mx-auto max-w-[42rem] text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            {headline}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
            {subhead}
          </p>
        </div>
      </section>

      {conversionEngineFlags.conversionUpgradeV1 ? <ConversionHomeBoost /> : null}

      <section id="home-search" className="border-t border-white/10 bg-black pb-10 pt-8 md:pb-12 md:pt-10">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <HomePrimarySearch searchExperiment={searchExperiment} />
          <HomeConversionCtas />
        </div>
      </section>
    </div>
  );
}
