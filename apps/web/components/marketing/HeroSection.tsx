"use client";

import { useState } from "react";
import Link from "next/link";
import { marketingType } from "@/config/typography";
import { SearchEngineBar, SearchFiltersProvider } from "@/components/search/SearchEngine";
import { TrustProofStrip } from "@/components/marketing/TrustProofStrip";

export function HeroSection() {
  const [browseMode, setBrowseMode] = useState<"buy" | "rent">("buy");

  return (
    <section className="relative overflow-hidden border-b border-white/10 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 lg:pt-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgb(var(--premium-gold-channels) / 0.15),transparent)]" />

      <div className="relative mx-auto max-w-3xl text-center">
        <p className={`mb-3 ${marketingType.heroEyebrow} text-premium-gold`}>Trust & compliance layer</p>
        <h1 className={`${marketingType.heroTitle} text-white`}>
          The First AI Platform That{" "}
          <span className="bg-gradient-to-r from-premium-gold to-amber-200 bg-clip-text text-transparent">
            Verifies Real Estate
          </span>{" "}
          Before You Sell It
        </h1>
        <p className={`mt-5 ${marketingType.heroSubtitle}`}>
          Stop losing deals because of incomplete, wrong, or risky listings. LECIPM verifies, scores, and prepares
          your property so buyers trust it instantly.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/sell"
            className="inline-flex min-h-[44px] min-w-[200px] items-center justify-center rounded-full bg-premium-gold px-8 py-3 text-sm font-semibold text-black shadow-[0_0_24px_rgb(var(--premium-gold-channels) / 0.35)] transition hover:bg-[#d4b55c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold/60"
          >
            Get Verified Now
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/20 px-8 py-3 text-sm font-medium text-white transition hover:border-premium-gold/50 hover:text-premium-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold/50"
          >
            See How It Works
          </a>
        </div>

        <TrustProofStrip />
      </div>

      <div className="relative mx-auto mt-12 max-w-2xl">
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-slate-500">Or browse listings</p>
        <SearchFiltersProvider mode={browseMode} key={browseMode}>
          <SearchEngineBar
            barTone="light"
            heroLayout
            heroBrowseMode={browseMode}
            onHeroBrowseModeChange={setBrowseMode}
          />
        </SearchFiltersProvider>
      </div>
    </section>
  );
}
