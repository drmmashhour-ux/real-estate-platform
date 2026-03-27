import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_NAME } from "@/config/branding";

export const metadata: Metadata = {
  title: "Sell with a platform broker",
  description: `List with a broker who works through ${PLATFORM_NAME}.`,
};

export default function SellingWithPlatformBrokerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/selling" className="text-sm font-medium text-[#C9A646] hover:underline">
        ← Selling
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]">Selling</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Sell with a platform broker</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#B3B3B3] sm:text-base">
        Your listing is represented by a licensed broker who uses {PLATFORM_NAME} for marketing, offers, messaging, and
        document workflows — so you get professional coverage with a single connected workspace.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/contact"
          className="rounded-full bg-[#C9A646] px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110"
        >
          Talk to us
        </Link>
        <Link
          href="/sell"
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#C9A646]/40 hover:text-[#C9A646]"
        >
          Explore sell options
        </Link>
      </div>
    </div>
  );
}
