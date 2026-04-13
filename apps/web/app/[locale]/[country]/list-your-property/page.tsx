import type { Metadata } from "next";
import Link from "next/link";
import { ListYourPropertyIntakeClient } from "./list-your-property-intake-client";
import { ListYourPropertySellerJourney, ListYourPropertyValueStrip } from "./list-your-property-sections";
import { ListYourPropertyPlansLeadsBundle } from "./list-your-property-plans-leads-bundle";
import {
  ListYourPropertyFinancingStrip,
  ListYourPropertyFaq,
  ListYourPropertyLegalFootnotes,
} from "./list-your-property-financing-faq";
import { ListYourPropertyBrokerDocumentDesk } from "./list-your-property-broker-document-desk";
import { PLATFORM_NAME } from "@/config/branding";
import { PLATFORM_CARREFOUR_NAME } from "@/lib/brand/platform";

export const metadata: Metadata = {
  title: `List your property | ${PLATFORM_NAME}`,
  description:
    "FSBO and self-represented sellers: AI intake, plans, and optional OACIQ residential broker document desk — 1% + tax or $599 + tax drafting. F-reference codes and Seller Hub.",
  robots: { index: true, follow: true },
};

export default function ListYourPropertyPage() {
  return (
    <main className="relative min-h-screen bg-black text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 45% at 50% -15%, rgb(212 175 55 / 0.28), transparent)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="text-sm font-medium text-premium-gold/90 transition hover:text-premium-gold"
        >
          ← Home
        </Link>

        <header className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold/85">{PLATFORM_CARREFOUR_NAME}</p>
          <p className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-[2.35rem]">
            Selling without a traditional desk doesn’t mean selling without support
          </p>
          <div className="mt-5 flex flex-wrap items-end justify-center gap-x-3 gap-y-1">
            <span
              className="font-serif text-4xl font-semibold uppercase leading-[0.95] tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-br from-[#fff8e7] via-[#d4af37] to-[#9a7b2c] drop-shadow-[0_0_28px_rgba(212,175,55,0.35)] sm:text-5xl sm:tracking-[0.2em]"
              style={{ WebkitBackgroundClip: "text" }}
            >
              Free
            </span>
            <span className="font-serif text-2xl font-medium lowercase italic text-premium-gold/95 sm:mb-1 sm:text-3xl">
              AI intake
            </span>
          </div>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-premium-gold/70">
            No upfront listing fee · upgrade only when you want more reach
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-slate-300">
            The platform runs your file: document classification, photo checks, readiness scoring, and inquiry routing.
            You confirm authority to publish; we never scrape third-party listings. Need{" "}
            <span className="text-slate-200">broker-prepared documents</span> for a private deal? See the licensed desk
            below — <span className="text-premium-gold/90">1% + tax</span> or a{" "}
            <span className="text-premium-gold/90">$599 + tax</span> drafting package.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#start-intake"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-premium-gold px-6 text-sm font-semibold text-black shadow-lg shadow-amber-900/25 transition hover:brightness-110"
            >
              Start free intake
            </a>
            <a
              href="#broker-document-desk"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-premium-gold/45 bg-premium-gold/10 px-6 text-sm font-semibold text-premium-gold transition hover:bg-premium-gold/15"
            >
              Broker documents (OACIQ)
            </a>
            <a
              href="#plans"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-semibold text-white transition hover:border-premium-gold/50 hover:bg-white/5"
            >
              View plans
            </a>
            <Link
              href="/pricing/seller"
              className="inline-flex min-h-[48px] items-center justify-center text-sm font-medium text-premium-gold/90 hover:text-premium-gold hover:underline"
            >
              Full pricing comparison →
            </Link>
          </div>
        </header>

        <div className="mt-14">
          <ListYourPropertyBrokerDocumentDesk />
        </div>

        <ListYourPropertySellerJourney />
        <ListYourPropertyValueStrip />

        <ListYourPropertyPlansLeadsBundle />

        <ListYourPropertyFinancingStrip />

        <ListYourPropertyFaq />

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-relaxed text-slate-500">
          Illustrative savings vs a hypothetical{" "}
          <span className="text-slate-400">5% total brokerage commission</span> on the same sale price are often used
          in industry marketing — not a guarantee of your net outcome. Taxes and third-party fees may apply. Plan
          features and checkout terms apply at purchase.
        </p>

        <section id="start-intake" className="mt-20 scroll-mt-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold/85">Free listing intake</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-white sm:text-3xl">Submit your package</h2>
            <p className="mt-3 text-sm text-slate-400">
              Step 1: ID, photos, documents (max 10 files). Step 2: contact & property particulars. You receive an{" "}
              <span className="text-slate-300">F-…</span> reference for your file and Seller Hub.
            </p>
          </div>
          <div className="mt-10">
            <ListYourPropertyIntakeClient />
          </div>
        </section>

        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-400">
          <p className="font-medium text-white">Already in Seller Hub?</p>
          <p className="mt-1 leading-relaxed">
            Open the full wizard for declaration, contracts, and BNHUB-style steps. Formal instrument templates and
            internal drafting books remain administrator-side.
          </p>
          <Link
            href="/dashboard/seller/create"
            className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-premium-gold px-5 text-sm font-semibold text-black hover:brightness-110"
          >
            Open listing wizard
          </Link>
        </div>

        <ListYourPropertyLegalFootnotes />
      </div>
    </main>
  );
}
