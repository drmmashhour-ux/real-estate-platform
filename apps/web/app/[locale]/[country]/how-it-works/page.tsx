import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand/platform";
import { LeadCTA } from "@/components/ui/LeadCTA";

export const metadata: Metadata = {
  title: "How it works",
  description: `Buy, sell, rent short stays, and get free property evaluations on ${PLATFORM_NAME} (${PLATFORM_CARREFOUR_NAME}) — one Quebec-focused platform. Secure payments and broker support.`,
  keywords: [
    PLATFORM_CARREFOUR_NAME,
    PLATFORM_NAME,
    "Quebec real estate",
    "BNHUB booking",
    "free property evaluation Montreal",
  ],
};

function FlowIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-premium-gold/35 bg-premium-gold/10 text-premium-gold">
      {children}
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold">Guide</p>
          <h1 className="font-serif mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            How {PLATFORM_NAME} works
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#B3B3B3]">
            A simple platform to buy, sell, rent, and evaluate properties
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: "Buy property",
              icon: (
                <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              ),
              steps: ["Browse listings", "Contact broker", "Book visit", "Close deal"],
              href: "/listings",
            },
            {
              title: "Sell property",
              icon: (
                <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              steps: ["Use FREE evaluation", "List your property", "Choose FSBO or broker", "Sell"],
              href: "/sell",
            },
            {
              title: "Rent / BNHUB",
              icon: (
                <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              steps: ["Search stays", "Book instantly", "Pay securely", "Get confirmation"],
              href: "/search/bnhub",
            },
            {
              title: "Get evaluation",
              icon: (
                <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              steps: ["Enter property details", "Get AI estimate", "Talk to broker"],
              href: "/evaluate",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="flex flex-col rounded-2xl border border-white/10 bg-[#121212] p-6 transition hover:border-premium-gold/35 hover:shadow-lg hover:shadow-premium-gold/5"
            >
              <FlowIcon>{card.icon}</FlowIcon>
              <h2 className="text-xl font-bold text-white">{card.title}</h2>
              <ol className="mt-4 flex-1 list-decimal space-y-2 pl-5 text-sm text-[#B3B3B3]">
                {card.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <Link
                href={card.href}
                className="mt-6 inline-flex text-sm font-semibold text-premium-gold hover:underline"
              >
                Start →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#111]/80">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-premium-gold">Trust</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Quebec platform",
              "Licensed broker support",
              "Secure Stripe payments",
              "Transparent process",
            ].map((t) => (
              <li
                key={t}
                className="rounded-xl border border-premium-gold/20 bg-[#0B0B0B] px-4 py-4 text-center text-sm font-medium text-white"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-dashed border-white/20 bg-[#121212] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Video — coming soon</p>
          <h3 className="mt-2 text-lg font-bold text-white">Watch how it works</h3>
          <p className="mt-2 text-sm text-[#B3B3B3]">
            A short walkthrough video will appear here. Until then, explore{" "}
            <Link href="/help" className="text-premium-gold hover:underline">
              Help center
            </Link>{" "}
            or start a flow below.
          </p>
        </div>

        <div className="mt-12">
          <LeadCTA variant="evaluation" className="justify-center" />
        </div>
        <p className="mt-8 text-center text-sm text-[#737373]">
          Questions? <Link href="/help" className="text-premium-gold hover:underline">Help center</Link>
          {" · "}
          <Link href="/broker/mohamed-al-mashhour" className="text-premium-gold hover:underline">
            Talk to a broker
          </Link>
        </p>
      </section>
    </main>
  );
}
