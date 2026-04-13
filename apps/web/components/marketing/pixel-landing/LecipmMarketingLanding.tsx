import Link from "next/link";
import { BnHubLogoMark } from "@/components/bnhub/BnHubLogoMark";
import { lecipmDesignTokens } from "@/lib/ui/lecipmDesignTokens";

const { black, card } = lecipmDesignTokens.color;
const GOLD = "var(--color-premium-gold)";

/**
 * Marketing landing — “Decision Engine” positioning; CTAs use `Link`.
 * Navbar/footer: `app/(marketing)/layout.tsx`.
 */
export function LecipmMarketingLanding() {
  return (
    <main className="bg-[#0D0D0D] text-white">
      {/* HERO */}
      <section className="px-6 py-16 text-center md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
          The Decision Engine for Real Estate
        </p>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
          Know if it&apos;s a good deal — before you commit.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400 md:text-xl">
          Analyze any real estate listing with AI. Detect risks, evaluate profitability, and make smarter decisions in
          seconds.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-500">
          LECIPM adds trust, intelligence, and clarity to every real estate decision.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/sell/create"
            className="rounded-xl px-8 py-3.5 text-base font-bold text-black shadow-lg transition hover:opacity-95"
            style={{ backgroundColor: GOLD }}
          >
            Analyze a property
          </Link>
          <Link
            href="/auth/register"
            className="rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white transition hover:border-white/35 hover:bg-white/10"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-t border-white/10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">Real estate decisions are:</h2>
          <ul className="mt-8 space-y-3 text-left text-slate-300 md:mx-auto md:max-w-md">
            <li className="flex gap-3">
              <span className="font-bold text-rose-400/90">·</span>
              <span>based on incomplete data</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-rose-400/90">·</span>
              <span>hard to evaluate</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-rose-400/90">·</span>
              <span>risky and time-consuming</span>
            </li>
          </ul>
          <p className="mt-10 text-sm font-medium text-slate-400">Most people don&apos;t know:</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li>if a listing is trustworthy</li>
            <li>if the price is right</li>
            <li>if the deal makes sense</li>
          </ul>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="border-t border-white/10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold md:text-3xl">LECIPM gives you:</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.08] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.45)]" style={{ backgroundColor: card }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
                TrustGraph
              </p>
              <p className="mt-3 text-slate-300">Verify listings and detect risks</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.45)]" style={{ backgroundColor: card }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
                Deal Analyzer
              </p>
              <p className="mt-3 text-slate-300">Understand profitability and deal quality</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.45)]" style={{ backgroundColor: card }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
                Copilot
              </p>
              <p className="mt-3 text-slate-300">Get clear recommendations instantly</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-t border-white/10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">How it works</h2>
          <ol className="mt-10 space-y-6 text-left text-lg text-slate-200">
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-bold" style={{ color: GOLD }}>
                1
              </span>
              <span className="pt-1.5">Paste or upload a listing</span>
            </li>
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-bold" style={{ color: GOLD }}>
                2
              </span>
              <span className="pt-1.5">We analyze it instantly</span>
            </li>
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-bold" style={{ color: GOLD }}>
                3
              </span>
              <span className="pt-1.5">You get a clear decision</span>
            </li>
          </ol>
          <p className="mt-10 text-sm font-medium text-slate-400">Simple. Fast. Powerful.</p>
        </div>
      </section>

      {/* VALUE */}
      <section className="border-t border-white/10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">Value</h2>
          <ul className="mt-10 space-y-4 text-left text-slate-300">
            <li className="flex gap-3">
              <span style={{ color: GOLD }}>✓</span>
              <span>avoid bad deals</span>
            </li>
            <li className="flex gap-3">
              <span style={{ color: GOLD }}>✓</span>
              <span>improve listing performance</span>
            </li>
            <li className="flex gap-3">
              <span style={{ color: GOLD }}>✓</span>
              <span>save hours of analysis</span>
            </li>
            <li className="flex gap-3">
              <span style={{ color: GOLD }}>✓</span>
              <span>make confident decisions</span>
            </li>
          </ul>
        </div>
      </section>

      {/* BNHUB — secondary */}
      <section className="border-t border-white/10 px-6 py-12">
        <div
          className="mx-auto max-w-4xl rounded-2xl border border-white/10 p-8 text-center"
          style={{ backgroundColor: card }}
        >
          <div className="flex justify-center">
            <BnHubLogoMark size="sm" className="max-w-[200px]" />
          </div>
          <p className="mt-3 text-sm text-slate-400">Short-term stays — same trust lens, different use case.</p>
          <Link
            href="/bnhub"
            className="mt-5 inline-block rounded-lg border border-white/20 px-6 py-2.5 text-sm font-medium text-white hover:border-premium-gold/50"
          >
            Explore BNHUB
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20 text-center md:py-24" style={{ backgroundColor: black }}>
        <h2 className="text-2xl font-bold md:text-3xl">Start analyzing your first property for free</h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-slate-500">
          Insights are educational — not legal, tax, or investment advice. Always do your own diligence.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/sell/create"
            className="rounded-xl px-8 py-3.5 text-base font-bold text-black"
            style={{ backgroundColor: GOLD }}
          >
            Analyze a property
          </Link>
          <Link
            href="/auth/register"
            className="rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/5"
          >
            Get started free
          </Link>
        </div>
      </section>
    </main>
  );
}
