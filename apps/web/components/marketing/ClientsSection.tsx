"use client";

import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { MarketingAnalyticsEvents, trackMarketingEvent } from "@/lib/analytics";

export function ClientsSection() {
  return (
    <section className="border-b border-white/5 bg-landing-black py-14 sm:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-serif)] text-3xl font-semibold text-white sm:text-4xl">
              For buyers & renters
            </h2>
            <ul className="mt-6 space-y-3 text-landing-text/85">
              <li className="flex gap-2">
                <span className="text-premium-gold">✓</span>
                Search homes and short stays in one ecosystem
              </li>
              <li className="flex gap-2">
                <span className="text-premium-gold">✓</span>
                Verified flows where the listing has completed checks
              </li>
              <li className="flex gap-2">
                <span className="text-premium-gold">✓</span>
                Secure BNHub checkout with Stripe where enabled
              </li>
            </ul>
          </div>
          <div>
            <Link
              href="/listings"
              onClick={() => trackMarketingEvent(MarketingAnalyticsEvents.heroCta, { surface: "clients_section_search" })}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-premium-gold px-8 py-3 text-sm font-semibold text-premium-bg shadow-landing-glow transition hover:bg-premium-gold-hover sm:w-auto"
            >
              Browse listings
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
