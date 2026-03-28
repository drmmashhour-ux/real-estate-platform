import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_NAME } from "@/config/branding";

export const metadata: Metadata = {
  title: "Buying by yourself",
  description: `Browse and compare properties on ${PLATFORM_NAME} without a dedicated platform broker.`,
};

export default function BuyingByYourselfPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/buying" className="text-sm font-medium text-premium-gold hover:underline">
        ← Buying
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Buying</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Buying by yourself</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#B3B3B3] sm:text-base">
        Use {PLATFORM_NAME} to research listings, save favorites, and run comparisons on your timeline. When you are
        ready to make an offer or need professional help, you can still reach out — including switching to a platform
        broker path if you choose.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/compare/fsbo"
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:text-premium-gold"
        >
          Compare listings
        </Link>
        <Link
          href="/contact"
          className="rounded-full bg-premium-gold px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110"
        >
          Questions? Contact us
        </Link>
      </div>
    </div>
  );
}
