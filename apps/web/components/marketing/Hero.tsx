import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { MarketingAnalyticsEvents } from "@/lib/analytics";
import { HeroCtaTrack } from "@/components/marketing/HeroCtaTrack";
import { getLandingRoiHref } from "@/lib/marketing/landing-roi-href";

export function Hero() {
  const roiHref = getLandingRoiHref();

  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-landing-black via-landing-dark to-landing-black">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(ellipse 90% 60% at 70% 0%, rgb(212 175 55 / 0.35), transparent 55%)",
        }}
        aria-hidden
      />
      <Container className="relative py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-premium-gold">LECIPM · BNHub</p>
            <h1 className="mt-4 max-w-[22ch] font-[family-name:var(--font-serif)] text-[length:var(--font-size-landing-hero)] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[3.35rem]">
              Find smarter stays in Montreal — better than Airbnb
            </h1>
            <p className="mt-5 text-base leading-relaxed text-landing-text/90 sm:text-lg">
              Verified listings. Better pricing. AI-powered platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <HeroCtaTrack
                href={roiHref}
                event={MarketingAnalyticsEvents.heroCta}
                variant="primary"
                label="Estimate my revenue"
              />
              <HeroCtaTrack
                href="/listings"
                event={MarketingAnalyticsEvents.heroCta}
                variant="secondary"
                label="Explore properties"
                meta={{ surface: "explore_listings" }}
              />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-landing-gray/40 shadow-landing-soft">
              <div className="absolute inset-0 bg-gradient-to-br from-premium-gold/10 via-transparent to-transparent" />
              <Image
                src="/branding/logo-dark.svg"
                alt=""
                width={320}
                height={120}
                sizes="(max-width: 1024px) 80vw, 400px"
                className="absolute left-1/2 top-1/2 h-auto w-[55%] max-w-[220px] -translate-x-1/2 -translate-y-1/2 opacity-90"
                priority
              />
              {/* Lightweight “dashboard” hint — no external stock imagery */}
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-white/80 backdrop-blur-sm">
                <p className="font-medium text-premium-gold">Insights snapshot</p>
                <p className="mt-1 text-white/60">Modeled views — connect your listing for live signals.</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
