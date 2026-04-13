import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_NAME, platformBrandGoldTextClass } from "@/lib/brand/platform";
import { ConversionEducationStrip } from "@/components/marketing/ConversionEducationStrip";
import { EvaluateClient } from "./evaluate-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FREE AI Property Evaluation",
  description:
    "Get an instant indicative property value for Montreal, Laval, and Quebec. 100% free, no obligation. Licensed broker follow-up available.",
  openGraph: {
    title: "FREE AI Property Evaluation",
    description: "Estimate your property value in minutes. No obligation.",
  },
};

export default function EvaluatePage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      {/* §1 Hero */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-3xl px-4 pt-8 pb-6 text-center sm:px-6 sm:pt-12 sm:pb-10 lg:px-8 lg:pt-14">
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${platformBrandGoldTextClass}`}>{PLATFORM_NAME}</p>
          <span className={`mt-4 inline-flex rounded-full border border-premium-gold/40 bg-premium-gold/10 px-4 py-1.5 text-xs font-semibold tracking-wide ${platformBrandGoldTextClass}`}>
            100% free — no obligation
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-tight">
            Find your property value instantly
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#B3B3B3] sm:text-lg">
            Get a FREE AI-powered property evaluation in seconds
          </p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-[#B3B3B3] sm:text-sm">
            <li className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5">100% free</li>
            <li className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5">No obligation</li>
            <li className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5">Instant results</li>
          </ul>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/appraisal-calculator"
              className="rounded-full border border-premium-gold/35 bg-premium-gold/10 px-5 py-2.5 text-sm font-semibold text-premium-gold transition hover:bg-premium-gold/15"
            >
              Open appraisal calculator page
            </Link>
            <Link
              href="/start-listing"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
            >
              Start your listing
            </Link>
          </div>
        </div>
      </section>

      <EvaluateClient />
      <ConversionEducationStrip variant="evaluate" />
    </main>
  );
}
