"use client";

import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { MarketingAnalyticsEvents, trackMarketingEvent } from "@/lib/analytics";
import { getLandingRoiHref } from "@/lib/marketing/landing-roi-href";
import { recordFunnelEvent } from "@/modules/conversion/funnel-metrics.service";

export function FinalCTA() {
  const roiHref = getLandingRoiHref();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-landing-dark to-landing-black py-16 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: "radial-gradient(circle at 50% 120%, rgb(212 175 55 / 0.2), transparent 55%)" }}
        aria-hidden
      />
      <Container className="relative text-center">
        <h2 className="font-[family-name:var(--font-serif)] text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
          Start free today
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-landing-text/85 sm:text-base">
          Analyze your property economics in minutes — modeled outputs, not guarantees.
        </p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
          <Link
            href="/hosts/onboarding"
            onClick={() => trackMarketingEvent(MarketingAnalyticsEvents.onboardingCta, { surface: "final_cta" })}
            className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-premium-gold px-10 py-3 text-sm font-semibold text-premium-bg shadow-landing-glow transition hover:bg-premium-gold-hover"
          >
            Start onboarding
          </Link>
          <Link
            href={roiHref}
            onClick={() => {
              recordFunnelEvent("homepage", "CTA_click");
              trackMarketingEvent(MarketingAnalyticsEvents.roiCta, { surface: "final_cta" });
            }}
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/25 px-10 py-3 text-sm font-semibold text-white hover:border-premium-gold/50"
          >
            Open ROI calculator
          </Link>
        </div>
      </Container>
    </section>
  );
}
