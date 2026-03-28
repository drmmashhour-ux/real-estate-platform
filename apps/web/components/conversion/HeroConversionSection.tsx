import { conversionCopy } from "@/src/design/conversionCopy";
import { PrimaryConversionCTA } from "./PrimaryConversionCTA";
import { SocialProofStrip } from "./SocialProofStrip";

export function HeroConversionSection({ ctaLabel }: { ctaLabel?: string }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-black px-6 py-12 sm:px-10 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-gold">The Decision Layer</p>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
        {conversionCopy.heroTitles[0]}
      </h1>
      <p className="mt-4 max-w-2xl text-base text-slate-300">{conversionCopy.landing.subhead}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <PrimaryConversionCTA
          href="/onboarding"
          label={ctaLabel ?? conversionCopy.ctas.primary[0]}
          event="conversion_track"
          meta={{ location: "hero" }}
        />
        <PrimaryConversionCTA
          href="/tools/deal-analyzer"
          label={conversionCopy.ctas.secondary[0]}
          event="conversion_track"
          meta={{ location: "hero_secondary" }}
          className="inline-flex rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
        />
      </div>
      <p className="mt-4 text-xs text-slate-500">{conversionCopy.landing.trustLine}</p>
      <SocialProofStrip />
    </section>
  );
}
