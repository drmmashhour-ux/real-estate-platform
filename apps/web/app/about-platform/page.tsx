import Link from "next/link";
import type { Metadata } from "next";
import { LecipmPlatformExplainSections } from "@/components/marketing/LecipmPlatformExplainSections";
import { PLATFORM_CARREFOUR_NAME } from "@/lib/brand/platform";

export const metadata: Metadata = {
  title: "About the platform",
  description:
    "What is LECIPM, how the investment experience works, and answers to common questions about the platform.",
};

export default function AboutPlatformPage() {
  return (
    <main className="bg-slate-950 text-slate-50">
      {/* Header */}
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            About the platform
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            A trusted ecosystem for real estate and lifestyle
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            {PLATFORM_CARREFOUR_NAME} is a relationship-driven real estate and
            lifestyle platform connecting people, licensed professionals, and
            investors within a trusted and verified digital ecosystem.
          </p>
          <p className="mt-6 flex flex-wrap gap-x-3 gap-y-2 text-sm text-slate-500">
            <a href="#what-is-lecipm" className="text-emerald-400 hover:underline">
              What is LECIPM?
            </a>
            <span aria-hidden>·</span>
            <a href="#how-it-works" className="text-emerald-400 hover:underline">
              How it works
            </a>
            <span aria-hidden>·</span>
            <a href="#faq-lecipm" className="text-emerald-400 hover:underline">
              FAQ
            </a>
          </p>
        </div>
      </section>

      {/* LECIPM investment product: explainer + FAQ */}
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <LecipmPlatformExplainSections accent="slate" />
        </div>
      </section>

      {/* What is the platform */}
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            What is this platform?
          </h2>
          <p className="mt-4 max-w-3xl text-sm text-slate-400 sm:text-base">
            A single place to discover properties, work with verified
            professionals, list or rent your own space, and explore investment
            opportunities. We combine marketplace tools with verification and
            safety so every participant can operate with confidence.
          </p>
        </div>
      </section>

      {/* Who participates */}
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            Who participates?
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400 sm:text-base">
            The platform brings together four types of participants so everyone
            can find what they need.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-sm font-semibold text-emerald-300">
                Users
              </span>
              <p className="mt-1 text-xs text-slate-400">
                People searching for property, experiences, or professional
                guidance.
              </p>
            </li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-sm font-semibold text-emerald-300">
                Licensed professionals
              </span>
              <p className="mt-1 text-xs text-slate-400">
                Verified brokers and real estate professionals operating under
                regulatory frameworks.
              </p>
            </li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-sm font-semibold text-emerald-300">
                Owners / hosts
              </span>
              <p className="mt-1 text-xs text-slate-400">
                Property owners offering rental or sale opportunities.
              </p>
            </li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-sm font-semibold text-emerald-300">
                Investors
              </span>
              <p className="mt-1 text-xs text-slate-400">
                Participants seeking investment opportunities or partnerships.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Why trust matters */}
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            Why trust matters
          </h2>
          <p className="mt-4 max-w-3xl text-sm text-slate-400 sm:text-base">
            Real estate decisions are high-stakes. We prioritize identity
            verification, professional credentials, and property authenticity so
            that listings, professionals, and investments are transparent and
            accountable. Our trust framework is built into how the platform
            works, not added as an afterthought.
          </p>
        </div>
      </section>

      {/* Platform services */}
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            Platform services
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400 sm:text-base">
            The platform offers integrated modules for buying, selling, renting,
            and investing.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <span className="text-emerald-400">•</span>
              <span>
                <strong className="text-slate-200">Marketplace</strong> — Browse
                and list properties for sale and long-term rental.
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <span className="text-emerald-400">•</span>
              <span>
                <strong className="text-slate-200">Short-term rentals (BNHub)</strong> —
                A verified short-term rental network integrated with the
                professional real-estate ecosystem: guests, hosts, brokers, and
                investors, with property verification and AI-assisted tools.
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <span className="text-emerald-400">•</span>
              <span>
                <strong className="text-slate-200">Broker CRM</strong> —
                Tools for licensed professionals to manage clients, listings, and
                deals.
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <span className="text-emerald-400">•</span>
              <span>
                <strong className="text-slate-200">Investment marketplace</strong> —
                Opportunities and partnerships for investors, with transparent
                data where applicable.
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <span className="text-emerald-400">•</span>
              <span>
                <strong className="text-slate-200">AI tools</strong> — Search,
                insights, and assistance to help users and professionals make
                better decisions.
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <span className="text-emerald-400">•</span>
              <span>
                <strong className="text-slate-200">Verification and safety</strong> —
                Identity, professional, and property verification plus
                anti-fraud and dispute resolution.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Verification and safety */}
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            Verification and safety
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400 sm:text-base">
            We combine verification and safety measures so participants can
            rely on the platform.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold text-emerald-300">
                Broker verification
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                Licensed professionals are verified against regulatory records
                before they can operate as verified on the platform.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold text-emerald-300">
                Property verification
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                Listings may be subject to ownership or right-to-list checks so
                users see authentic, authorized offers.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold text-emerald-300">
                Anti-fraud protection
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                We use detection, reporting, and enforcement to reduce scams and
                fraud and to resolve disputes fairly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            Community
          </h2>
          <p className="mt-4 max-w-3xl text-sm text-slate-400 sm:text-base">
            The platform is also a relationship ecosystem. We encourage
            long-term professional relationships between members, property
            professionals, and investors. Trust is built through repeated
            interactions, clear communication, and shared standards—so the
            platform is designed to support lasting connections, not only
            one-off transactions.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Ready to explore properties or talk to our team?
            </p>
            <div className="flex gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Browse properties
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/40 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/70"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
