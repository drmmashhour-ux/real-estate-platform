import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_NAME } from "@/config/branding";

export const metadata: Metadata = {
  title: "Buying with a selected broker",
  description: `Choose your own licensed broker and coordinate your purchase through ${PLATFORM_NAME}.`,
};

export default function BuyingWithSelectedBrokerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/buying" className="text-sm font-medium text-premium-gold hover:underline">
        ← Buying
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Buying</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Buy with a selected broker</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#B3B3B3] sm:text-base">
        Bring a broker you already know and trust, or ask us for introductions to verified professionals in your market.
        You keep control of the relationship while we support scheduling, documents, and compliance on the platform.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/listings"
          className="rounded-full bg-premium-gold px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110"
        >
          Browse listings
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:text-premium-gold"
        >
          Request an introduction
        </Link>
        <Link
          href="/how-it-works"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-premium-gold/40"
        >
          How it works
        </Link>
      </div>
    </div>
  );
}
