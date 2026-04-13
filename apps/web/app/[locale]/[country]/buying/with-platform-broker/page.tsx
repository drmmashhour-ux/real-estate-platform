import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_NAME } from "@/config/branding";

export const metadata: Metadata = {
  title: "Buying with a platform broker",
  description: `Work with a licensed broker on ${PLATFORM_NAME} for your purchase.`,
};

export default function BuyingWithPlatformBrokerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/buying" className="text-sm font-medium text-premium-gold hover:underline">
        ← Buying
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Buying</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Buying with a platform broker</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#B3B3B3] sm:text-base">
        Get representation from a licensed broker who works with {PLATFORM_NAME} — from search strategy and showings to
        offers, negotiations, and closing coordination. We will route your request to the right team.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/contact"
          className="rounded-full bg-premium-gold px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110"
        >
          Request a broker
        </Link>
        <Link
          href="/compare/fsbo"
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:text-premium-gold"
        >
          Browse listings
        </Link>
      </div>
    </div>
  );
}
