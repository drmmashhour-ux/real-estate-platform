import Link from "next/link";

/**
 * Public marketing strip — drives brokers to dashboard AI Listing Assistant after auth.
 */
export function ListingAssistantMarketingStrip() {
  return (
    <section
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6"
      aria-labelledby="listing-assistant-heading"
    >
      <div className="rounded-2xl border border-[#D4AF37]/35 bg-[#111]/90 px-6 py-8 text-center sm:px-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Broker differentiation</p>
        <h2 id="listing-assistant-heading" className="mt-3 text-xl font-bold text-white sm:text-2xl">
          AI-Powered Listing Assistant
        </h2>
        <ul className="mx-auto mt-5 max-w-lg space-y-2 text-left text-sm leading-relaxed text-[#B3B3B3]">
          <li>Fill forms faster with structured Centris-ready fields</li>
          <li>Optimize listings automatically — titles, descriptions, highlights</li>
          <li>Reduce legal risk — compliance hints before you publish</li>
          <li>Increase visibility and conversion with disciplined copy</li>
        </ul>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/join-broker"
            className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Become a broker
          </Link>
          <Link
            href="/auth/login?returnUrl=%2Fdashboard%2Flistings%2Fassistant"
            className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-black hover:brightness-110"
          >
            Sign in — Listing Assistant
          </Link>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-[#666]">
          Assistive AI only — brokers validate all outputs. LECIPM does not auto-publish to Centris or third-party MLS.
        </p>
      </div>
    </section>
  );
}
