import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/config/branding";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export const metadata: Metadata = {
  title: "About",
  description: `${PLATFORM_NAME} — ${PLATFORM_CARREFOUR_NAME}. The operating system for real estate transactions.`,
  ...(siteUrl
    ? {
        metadataBase: new URL(siteUrl),
        openGraph: {
          title: `About | ${PLATFORM_NAME}`,
          description: `${PLATFORM_NAME} — unified CRM, deals, documents, and finance.`,
          url: `${siteUrl}/about`,
        },
      }
    : {
        openGraph: {
          title: `About | ${PLATFORM_NAME}`,
          description: `${PLATFORM_NAME} — unified CRM, deals, documents, and finance.`,
        },
      }),
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <AnimatedReveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">About</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-white">{PLATFORM_NAME}</h1>
        <p className="mt-2 text-lg text-premium-gold/90">{PLATFORM_CARREFOUR_NAME}</p>
        <div className="mt-8 space-y-4 text-slate-300">
          <p>
            We build software for brokerages and investors who need one connected workflow — not another point
            solution. From CRM and offers to contracts, documents, scheduling, and finance, LECIPM is designed as an
            operational layer you can run a business on.
          </p>
          <p>
            Our team combines deep real-estate domain experience with modern product engineering — multi-tenant
            patterns, audit-friendly documents, and analytics that leadership can trust.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/contact"
            className="rounded-full bg-premium-gold px-6 py-3 text-sm font-semibold text-black hover:brightness-110"
          >
            Contact us
          </Link>
          <Link href="/demos" className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white">
            Try the demo
          </Link>
        </div>
      </AnimatedReveal>
    </div>
  );
}
