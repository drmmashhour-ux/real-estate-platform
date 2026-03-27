import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ConversionEducationStrip } from "@/components/marketing/ConversionEducationStrip";
import { LeadCTA } from "@/components/ui/LeadCTA";
import { getBrokerPhoneDisplay, getBrokerTelHref, getContactWhatsAppUrl } from "@/lib/config/contact";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand/platform";

export const metadata: Metadata = {
  title: "Sell by yourself vs broker",
  description: `Compare FSBO vs working with a licensed Quebec broker. FREE AI evaluation and consultation — no obligation. ${PLATFORM_NAME} (${PLATFORM_CARREFOUR_NAME}) & Mohamed Al Mashhour (J1321).`,
  openGraph: {
    title: "Sell your property the smart way",
    description: "FSBO vs broker — clear comparison. FREE consultation available.",
  },
};

const ROWS: { label: string; fsbo: string; broker: string }[] = [
  {
    label: "Price accuracy",
    fsbo: "Risk of underpricing or overpricing",
    broker: "Market analysis & data-driven pricing",
  },
  {
    label: "Exposure",
    fsbo: "Limited visibility",
    broker: "MLS + marketing + network",
  },
  {
    label: "Negotiation",
    fsbo: "Emotional + limited experience",
    broker: "Professional negotiation",
  },
  {
    label: "Legal protection",
    fsbo: "Risk of mistakes",
    broker: "Contracts + compliance",
  },
  {
    label: "Time required",
    fsbo: "Time-consuming",
    broker: "Handled for you",
  },
  {
    label: "Final result potential",
    fsbo: "Often lower net result",
    broker: "Often higher final sale price",
  },
];

export default function SellComparePage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      {/* Hero */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <span className="inline-flex rounded-full border border-[#C9A646]/45 bg-[#C9A646]/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#C9A646]">
            100% free consultation available
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-tight">
            Sell your property the smart way
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#B3B3B3]">
            Compare selling by yourself vs working with a licensed broker
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-[#9CA3AF] sm:text-sm">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">No obligation</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Free consultation</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Local Quebec broker</span>
          </div>
          <Link
            href="/evaluate"
            className="mt-8 inline-flex rounded-xl bg-[#C9A646] px-8 py-3.5 text-sm font-bold text-[#0B0B0B] shadow-lg shadow-black/40 transition hover:bg-[#E8C547]"
          >
            Get my FREE evaluation
          </Link>
        </div>
      </section>

      <ConversionEducationStrip variant="compare" />

      {/* Comparison table */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-center text-xl font-bold text-white sm:text-2xl">Side-by-side comparison</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-[#737373]">
          Same property — two paths. See where a licensed broker adds value.
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-[#C9A646]/25 bg-[#121212] shadow-xl">
          {/* Header row (desktop) */}
          <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)] border-b border-[#C9A646]/30 bg-[#0B0B0B] md:grid">
            <div className="p-4" />
            <div className="border-l border-white/10 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B3B3B3]">Sell by yourself</p>
              <p className="mt-1 text-sm font-semibold text-white">FSBO</p>
            </div>
            <div className="border-l border-[#C9A646]/30 bg-[#C9A646]/[0.06] p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A646]">With a broker</p>
              <p className="mt-1 text-sm font-semibold text-white">{PLATFORM_NAME}</p>
            </div>
          </div>

          {ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-1 border-t border-white/10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)] ${
                i % 2 === 1 ? "md:bg-white/[0.02]" : ""
              }`}
            >
              <div className="border-b border-white/10 p-5 md:border-b-0 md:border-r md:border-white/10 md:p-4">
                <p className="text-sm font-semibold text-[#C9A646]">{row.label}</p>
              </div>
              <div className="border-b border-white/10 p-5 pt-0 md:border-b-0 md:border-r md:border-white/10 md:p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#737373] md:hidden">FSBO</p>
                <p className="flex items-start gap-2 text-sm text-[#B3B3B3]">
                  <span className="shrink-0 text-red-400" aria-hidden>
                    ❌
                  </span>
                  {row.fsbo}
                </p>
              </div>
              <div className="bg-[#C9A646]/[0.04] p-5 pt-0 md:bg-transparent md:p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#C9A646] md:hidden">
                  With a broker ({PLATFORM_NAME})
                </p>
                <p className="flex items-start gap-2 text-sm text-white">
                  <span className="shrink-0 text-emerald-400" aria-hidden>
                    ✅
                  </span>
                  {row.broker}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Key message */}
        <div className="mt-12 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-[#121212] px-6 py-8 sm:px-10">
          <p className="text-center text-lg font-semibold leading-relaxed text-white sm:text-xl">
            Many sellers who start alone later choose expert support — often after losing time or leverage.
          </p>
        </div>
      </section>

      {/* OACIQ */}
      <section className="border-t border-white/10 bg-[#121212]/50 py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]">Regulation & trust</p>
          <h2 className="mt-3 text-2xl font-bold text-white">OACIQ — Quebec real estate authority</h2>
          <p className="mt-4 text-[#B3B3B3]">
            Working with a licensed broker is regulated by{" "}
            <strong className="text-white">OACIQ</strong> (Québec&apos;s real estate authority).
          </p>
          <ul className="mx-auto mt-6 max-w-xl space-y-3 text-left text-sm text-[#B3B3B3]">
            <li className="flex gap-3">
              <span className="text-[#C9A646]">●</span>
              <span>
                <strong className="text-white">Protection</strong> — professional standards and oversight for the public.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#C9A646]">●</span>
              <span>
                <strong className="text-white">Transparency</strong> — clear rules on representation, contracts, and disclosures.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#C9A646]">●</span>
              <span>
                <strong className="text-white">Professionalism</strong> — trained, licensed brokers held to a code of ethics.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Broker */}
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-[#C9A646]/30 bg-gradient-to-br from-[#121212] to-[#0B0B0B] p-8 sm:p-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            <div className="relative mx-auto h-44 w-36 shrink-0 overflow-hidden rounded-xl border-2 border-[#C9A646] bg-[#1a1a1a] sm:mx-0">
              <Image
                src="/images/broker.jpg"
                alt="Mohamed Al Mashhour, Residential Real Estate Broker"
                fill
                className="object-cover"
                sizes="144px"
                priority
              />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <span className="inline-flex rounded-full border border-[#C9A646]/40 bg-[#C9A646]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#C9A646]">
                Verified Broker
              </span>
              <h2 className="mt-4 text-2xl font-bold text-white">Mohamed Al Mashhour</h2>
              <p className="text-sm text-[#B3B3B3]">Residential Real Estate Broker (J1321)</p>
              <p className="mt-4 text-sm leading-relaxed text-[#E5E5E5]">
                I help clients sell faster and at the best price with a clear strategy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Free value */}
      <section className="mx-auto max-w-3xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-[#121212] px-6 py-8 text-center sm:px-10">
          <h2 className="text-xl font-bold text-[#C9A646] sm:text-2xl">FREE services available</h2>
          <ul className="mx-auto mt-6 max-w-md space-y-3 text-left text-sm text-[#B3B3B3]">
            <li className="flex items-center gap-2">
              <span className="text-[#C9A646]">✓</span> Free AI evaluation
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#C9A646]">✓</span> Free consultation
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#C9A646]">✓</span> No obligation
            </li>
          </ul>
          <Link
            href="/evaluate"
            className="mt-8 inline-flex rounded-xl bg-[#C9A646] px-8 py-3.5 text-sm font-bold text-[#0B0B0B] hover:bg-[#E8C547]"
          >
            Get my FREE evaluation
          </Link>
        </div>
      </section>

      {/* Strong CTA */}
      <section className="border-t border-[#C9A646]/20 bg-[#0B0B0B] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Get the best price for your property</h2>
          <p className="mt-3 text-sm text-[#737373]">No obligation · Free consultation · Local Quebec broker</p>
          <div className="mx-auto mt-8 max-w-2xl text-left">
            <LeadCTA variant="evaluation" />
          </div>
          <p className="mt-10 text-xs text-[#525252]">
            FSBO remains available on {PLATFORM_CARREFOUR_NAME} — this page helps you choose with full information.
          </p>
        </div>
      </section>
    </main>
  );
}
