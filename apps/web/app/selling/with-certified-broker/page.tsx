import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_NAME } from "@/config/branding";

export const metadata: Metadata = {
  title: "Sell with a certified broker",
  description: `Full-service listing with a certified broker through ${PLATFORM_NAME}.`,
};

export default function SellingWithCertifiedBrokerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/selling" className="text-sm font-medium text-premium-gold hover:underline">
        ← Selling
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Selling</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Sell with a certified broker</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#B3B3B3] sm:text-base">
        For sellers who want traditional brokerage service: pricing strategy, showings, negotiation, and regulatory
        paperwork handled by a certified professional. {PLATFORM_NAME} coordinates documents and communication in one
        place.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/contact"
          className="rounded-full bg-premium-gold px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110"
        >
          Request a certified broker
        </Link>
        <Link
          href="/broker/pricing"
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:text-premium-gold"
        >
          Broker programs
        </Link>
      </div>
    </div>
  );
}
