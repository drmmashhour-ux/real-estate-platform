"use client";

import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { MarketingAnalyticsEvents, trackMarketingEvent } from "@/lib/analytics";

export function HostsSection() {
  return (
    <section className="border-b border-white/5 bg-landing-dark py-14 sm:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-serif)] text-3xl font-semibold text-white sm:text-4xl">For hosts</h2>
            <ul className="mt-6 space-y-3 text-landing-text/85">
              <li className="flex gap-2">
                <span className="text-premium-gold">✓</span>
                BNHub stays with Stripe-backed checkout where enabled
              </li>
              <li className="flex gap-2">
                <span className="text-premium-gold">✓</span>
                Pricing insights and ROI modeling with clear disclaimers
              </li>
              <li className="flex gap-2">
                <span className="text-premium-gold">✓</span>
                Fast onboarding funnel when you’re ready to switch
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/hosts/onboarding"
              onClick={() => trackMarketingEvent(MarketingAnalyticsEvents.onboardingCta, { surface: "hosts_section" })}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-premium-gold px-8 py-3 text-center text-sm font-semibold text-premium-bg shadow-landing-glow transition hover:bg-premium-gold-hover"
            >
              Start onboarding
            </Link>
            <Link
              href="/hosts"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/20 px-8 py-3 text-center text-sm font-semibold text-white hover:border-premium-gold/40"
            >
              Host overview
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
