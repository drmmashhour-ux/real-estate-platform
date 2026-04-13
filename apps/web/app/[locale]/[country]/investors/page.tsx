import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

const GOLD = "#D4AF37";
const BLACK = "#0b0b0b";
const MUTED = "#bfbfbf";
const PANEL = "#141414";

export const metadata: Metadata = {
  title: "Investors · LECIPM Manager",
  description:
    "LECIPM Manager — AI-managed real estate and short-term rental marketplace. Investor overview: problem, solution, model, and stage.",
  robots: { index: true, follow: true },
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-3xl px-6 py-16 md:py-20">
      <h2 className="mb-6 text-xl font-semibold tracking-tight text-white md:text-2xl" style={{ color: GOLD }}>
        {title}
      </h2>
      <div className="space-y-4 text-[15px] leading-relaxed md:text-base" style={{ color: MUTED }}>
        {children}
      </div>
    </section>
  );
}

export default function InvestorsPage() {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ backgroundColor: BLACK }}>
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-white/80 transition hover:text-white">
            ← Home
          </Link>
          <Link
            href="/support"
            className="rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
            style={{ borderColor: `${GOLD}66`, color: GOLD }}
          >
            Contact
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-12 pt-16 text-center md:pt-24">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
          Investor overview
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">LECIPM Manager</h1>
        <p className="mx-auto mb-10 max-w-xl text-lg md:text-xl" style={{ color: MUTED }}>
          AI-managed real estate &amp; short-term rental marketplace
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/support"
            className="inline-flex min-w-[200px] items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold text-black transition hover:opacity-95"
            style={{ backgroundColor: GOLD }}
          >
            Request introduction
          </Link>
        </div>
        <p className="mx-auto mt-8 max-w-lg text-xs leading-normal text-white/45">
          No live traction metrics are displayed on this page. Financial examples in offline materials are labeled{" "}
          <strong className="text-white/60">illustrative</strong> only.
        </p>
      </section>

      <div className="mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <Section id="problem-solution" title="Problem & solution">
        <p style={{ color: MUTED }}>
          <strong className="text-white/90">Guests</strong> need trustworthy stays, clear fees, and reliable status after
          they book. <strong className="text-white/90">Hosts</strong> need pricing, occupancy, and communication that do
          not depend on fragmented tools. <strong className="text-white/90">LECIPM Manager</strong> unifies discovery,
          booking, payments, host operations, and trust workflows — with AI assisting search, pricing, and promotions
          while people retain accountability for policy and compliance.
        </p>
      </Section>

      <Section id="product" title="Product">
        <ul className="list-inside list-disc space-y-2 marker:text-[#D4AF37]">
          <li>Web and mobile experiences for guests and hosts</li>
          <li>Instant booking and hosted checkout</li>
          <li>Host dashboard, messaging, and notifications</li>
          <li>AI search and AI pricing suggestions</li>
          <li>Trust patterns: checklists, structured support paths</li>
        </ul>
      </Section>

      <Section id="business-model" title="Business model">
        <p style={{ color: MUTED }}>
          Revenue is designed to align with completed stays and optional guest choices:{" "}
          <strong className="text-white/90">booking fees</strong> (fee levels are contractual; illustrative models often
          use a <strong className="text-white/90">10–20%</strong> range on average order value for discussion only),{" "}
          <strong className="text-white/90">qualified insurance and partner leads</strong> where guests opt in, and{" "}
          <strong className="text-white/90">checkout upsells</strong> disclosed before payment.
        </p>
      </Section>

      <Section id="traction" title="Traction & stage">
        <div className="rounded-2xl border border-white/10 p-6" style={{ backgroundColor: PANEL }}>
          <ul className="list-inside list-disc space-y-2 marker:text-[#D4AF37]">
            <li>Platform built</li>
            <li>Soft launch ready</li>
            <li>End-to-end booking and payment flows in product</li>
            <li>Host-side systems and AI-assisted tooling implemented</li>
          </ul>
          <p className="mt-4 text-sm text-white/50">
            Verified KPIs are shared in direct conversations when available — not fabricated on this page.
          </p>
        </div>
      </Section>

      <Section id="vision" title="Vision">
        <p style={{ color: MUTED }}>
          Build a fully <strong className="text-white/90">AI-managed marketplace</strong> where AI supports pricing,
          discovery, promotions, communication, and structured dispute assistance — improving conversion and host yield
          while preserving human oversight where regulation and trust require it.
        </p>
      </Section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-4 text-center">
        <div className="rounded-2xl border border-white/10 px-8 py-12" style={{ backgroundColor: PANEL }}>
          <h2 className="mb-3 text-lg font-semibold text-white md:text-xl">Investor materials</h2>
          <p className="mx-auto mb-8 max-w-md text-sm" style={{ color: MUTED }}>
            Deck, one-pager, illustrative financial appendix, FAQ, and GTM summary live in the repository under{" "}
            <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-white/70">docs/investors/</code>.
          </p>
          <Link
            href="/support"
            className="inline-flex min-w-[200px] items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold text-black transition hover:opacity-95"
            style={{ backgroundColor: GOLD }}
          >
            Contact the team
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-white/40">
        LECIPM Manager — confidential overview for qualified discussions.
      </footer>
    </div>
  );
}
