import Link from "next/link";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";
import { Footer } from "@/components/marketing/Footer";
import { LandingScrollDepth } from "@/components/marketing/LandingScrollDepth";
import { HomeMarketingFunnelPv } from "@/components/marketing/HomeMarketingFunnelPv";
import { LecipmLandingLeadForm } from "@/components/marketing/lecipm-landing-lead-form";
import { PublicTestimonialsStrip } from "@/components/marketing/PublicTestimonialsStrip";
import { VisitorGuideChat } from "@/components/ai/VisitorGuideChat";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

type Props = {
  /** Defaults so `/` fallback and tests work without params. */
  locale?: string;
  country?: string;
};

export function LecipmLeadCaptureLanding({
  locale = routing.defaultLocale,
  country = DEFAULT_COUNTRY_SLUG,
}: Props) {
  const base = `/${locale}/${country}`;

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <VisitorGuideChat surface="landing" />
      <HomeMarketingFunnelPv />
      <LandingScrollDepth />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <LecipmBrandLockup href={`${base}/`} variant="dark" density="compact" className="shrink-0" />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={`${base}/auth/login`}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-white/80 transition hover:text-white sm:text-sm"
            >
              Sign in
            </Link>
            <Link
              href={`${base}/signup`}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 sm:text-sm"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212,175,55,0.35), transparent 55%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/90">
              LECIPM
            </p>
            <h1 className="mt-6 text-center font-serif text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
              List once. Optimize with AI. Close faster.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-white/70 sm:text-xl">
              LECIPM transforms your listings into intelligent, high-converting deals.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              <Link
                href={`${base}/evaluate`}
                className="lecipm-mobile-btn-full inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-xl bg-brand-gold px-8 py-3.5 text-sm font-semibold text-black shadow-[0_0_40px_-8px_rgba(212,175,55,0.55)] transition hover:bg-brand-gold/90 sm:w-auto"
              >
                Get full AI analysis
              </Link>
              <Link
                href={`${base}/contact`}
                className="lecipm-mobile-btn-full inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-xl border border-brand-gold/40 bg-transparent px-8 py-3.5 text-sm font-semibold text-brand-gold transition hover:border-brand-gold hover:bg-brand-gold/10 sm:w-auto"
              >
                Book a demo
              </Link>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="border-b border-white/10 bg-premium-surface/50 py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center sm:flex-row sm:justify-center sm:gap-12 sm:px-6">
            <p className="text-sm font-medium text-white/85">Built for modern real estate brokers</p>
            <span className="hidden h-4 w-px bg-white/20 sm:block" aria-hidden />
            <p className="text-sm font-medium text-brand-gold/95">AI-powered listing optimization</p>
          </div>
        </section>

        <PublicTestimonialsStrip />

        {/* Green program — marketplace + investor angle */}
        <section className="border-b border-white/10 bg-gradient-to-b from-emerald-950/40 to-black py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">LECIPM AI Green Score</p>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Turn any property into a green investment
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-white/75">
              AI-assessed green properties, optional document-backed verification, and marketplace lift for eligible listings.
              This is not an official government certification — always review the disclaimer with buyers.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                "Higher intent buyers care about operating cost & carbon exposure",
                "Transparent upgrade path improves perceived asset quality",
                "Aligned with long-term sustainability demand from investors & occupiers",
              ].map((line) => (
                <li key={line} className="rounded-2xl border border-emerald-500/20 bg-black/40 px-5 py-4 text-sm text-emerald-50/95">
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`${base}/contact`}
                className="inline-flex rounded-xl bg-emerald-500/90 px-6 py-3 text-sm font-semibold text-black hover:bg-emerald-400"
              >
                Ask about Green Upgrade Program
              </Link>
              <Link
                href={`${base}/evaluate`}
                className="inline-flex rounded-xl border border-emerald-400/40 px-6 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/10"
              >
                Run AI analysis
              </Link>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Real estate platforms are passive
          </h2>
          <ul className="mt-8 space-y-4 text-lg text-white/75">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
              Listings don&apos;t convert
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
              Brokers lose leads
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
              No intelligence layer
            </li>
          </ul>
        </section>

        {/* Solution */}
        <section className="border-y border-white/10 bg-premium-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              LECIPM changes the game
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "AI listing assistant",
                "Deal intelligence",
                "Compliance + risk detection",
                "Lead capture system",
              ].map((line) => (
                <li
                  key={line}
                  className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white/90"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
          <ol className="mt-12 space-y-6">
            {[
              "List property",
              "Capture leads",
              "AI analyzes deal",
              "Broker gets guidance",
              "Close faster",
            ].map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-gold/40 bg-brand-gold/10 text-sm font-bold text-brand-gold">
                  {i + 1}
                </span>
                <span className="pt-2 text-lg text-white/85">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section className="border-t border-white/10 bg-black py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for serious brokers
            </h2>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "AI Listing Assistant", body: "Optimize copy, pricing signals, and positioning fast." },
                { title: "Deal Intelligence", body: "Scores and signals so you know what to push and when." },
                { title: "Compliance Shield", body: "Catch risk patterns before they become problems." },
                { title: "Investment Insights", body: "Sharper angles for buyers and investors." },
              ].map((card) => (
                <div
                  key={card.title}
                  className="flex flex-col rounded-2xl border border-brand-gold/20 bg-premium-card/80 p-6 shadow-[0_0_0_1px_rgba(212,175,55,0.06)]"
                >
                  <h3 className="font-semibold text-brand-gold">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Why brokers use LECIPM
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { t: "Save time", d: "Less manual research. More decisive action." },
              { t: "Reduce risk", d: "Compliance and deal signals surfaced early." },
              { t: "Increase conversions", d: "Smarter listings and follow-through." },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-lg font-semibold text-white">{x.t}</p>
                <p className="mt-2 text-sm text-white/60">{x.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-y border-brand-gold/25 bg-gradient-to-b from-brand-gold/[0.07] to-transparent py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Start using AI in your real estate workflow
            </h2>
            <Link
              href={`${base}/signup`}
              className="mt-10 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-brand-gold px-10 py-3.5 text-sm font-semibold text-black transition hover:bg-brand-gold/90"
            >
              Try LECIPM
            </Link>
          </div>
        </section>

        {/* Lead capture */}
        <section id="unlock" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight">Unlock full analysis</h2>
            <p className="mt-3 text-white/60">Leave your email — we&apos;ll send next steps.</p>
          </div>
          <div className="mx-auto mt-10 max-w-md">
            <LecipmLandingLeadForm idPrefix="lecipm-landing" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
