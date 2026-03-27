import type { Metadata } from "next";
import { HeroConversionSection } from "@/components/conversion/HeroConversionSection";
import { NextActionPanel } from "@/components/conversion/NextActionPanel";
import { TrustDealSummaryCard } from "@/components/conversion/TrustDealSummaryCard";
import { SocialProofStrip } from "@/components/conversion/SocialProofStrip";
import { PrimaryConversionCTA } from "@/components/conversion/PrimaryConversionCTA";
import { conversionCopy } from "@/src/design/conversionCopy";
import { PLATFORM_NAME } from "@/config/branding";

const title = "LECIPM — The Decision Engine for Real Estate";
const description =
  "Analyze any property, detect risks, and know if it's a good deal — instantly. LECIPM adds trust, intelligence, and clarity to every real estate decision. TrustGraph, Deal Analyzer, and Copilot.";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "real estate trust",
    "listing verification",
    "deal analyzer",
    "real estate AI",
    "LECIPM",
    PLATFORM_NAME,
  ],
  ...(siteUrl
    ? {
        metadataBase: new URL(siteUrl),
        openGraph: {
          title: `${title} | ${PLATFORM_NAME}`,
          description,
          url: siteUrl,
          siteName: PLATFORM_NAME,
          type: "website",
          locale: "en_CA",
        },
        twitter: {
          card: "summary_large_image",
          title: `${title} | ${PLATFORM_NAME}`,
          description,
        },
      }
    : {
        openGraph: {
          title: `${title} | ${PLATFORM_NAME}`,
          description,
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title: `${title} | ${PLATFORM_NAME}`,
          description,
        },
      }),
};

export default function LandingPage() {
  return (
    <main className="bg-black text-white">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <HeroConversionSection ctaLabel={conversionCopy.ctas.primary[0]} />
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-3">
        <TrustDealSummaryCard
          trustScore={82}
          dealScore={78}
          confidence="high"
          reasons={["Verified ownership signals", "Comparable pricing alignment", "Risk checks completed"]}
        />
        <TrustDealSummaryCard
          trustScore={58}
          dealScore={64}
          confidence="medium"
          reasons={["Partial documents only", "Strong rent ratio", "Market volatility in zone"]}
        />
        <TrustDealSummaryCard
          trustScore={40}
          dealScore={49}
          confidence="low"
          reasons={["Missing legal disclosures", "Price drift above comparables", "Fraud risk warning"]}
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {conversionCopy.landing.howItWorks.map((s, idx) => (
            <div key={s} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              Step {idx + 1}: {s}
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {conversionCopy.landing.trustSection.map((line) => (
            <p key={line} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
              {line}
            </p>
          ))}
        </div>
        <SocialProofStrip />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <NextActionPanel
          title={conversionCopy.ctas.final}
          body="Analyze one listing now. Then unlock CRM prioritization and premium insight depth only when you are ready."
          ctaHref="/onboarding"
          ctaLabel={conversionCopy.ctas.primary[0]}
          secondaryHref="/pricing"
          secondaryLabel="View pricing"
        />
        <div className="mt-6 text-center">
          <PrimaryConversionCTA href="/onboarding" label={conversionCopy.ctas.final} event="conversion_track" />
        </div>
      </section>
    </main>
  );
}
