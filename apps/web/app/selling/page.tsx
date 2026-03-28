import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_NAME } from "@/config/branding";

export const metadata: Metadata = {
  title: "Selling",
  description: `Choose how you want to sell a property on ${PLATFORM_NAME} — FSBO, with a platform broker, or with a certified broker.`,
};

export default function SellingHubPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Selling</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">How do you want to sell?</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#B3B3B3] sm:text-base">
        Three ways to list: handle more yourself, work with a broker on our platform, or engage a certified broker
        with full-service representation.
      </p>

      <ul className="mt-10 grid gap-4">
        <li>
          <Link
            href="/selling/by-yourself"
            className="block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-premium-gold/40 hover:bg-white/[0.05]"
          >
            <h2 className="text-lg font-semibold text-white">Sell by yourself</h2>
            <p className="mt-2 text-sm text-[#B3B3B3]">
              List FSBO-style: publish your property, manage inquiries, and upload documents from your dashboard.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-premium-gold">Learn more →</span>
          </Link>
        </li>
        <li>
          <Link
            href="/selling/with-platform-broker"
            className="block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-premium-gold/40 hover:bg-white/[0.05]"
          >
            <h2 className="text-lg font-semibold text-white">Sell with a platform broker</h2>
            <p className="mt-2 text-sm text-[#B3B3B3]">
              Partner with a licensed broker who works through {PLATFORM_NAME} — marketing, offers, and closing in one
              place.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-premium-gold">Learn more →</span>
          </Link>
        </li>
        <li>
          <Link
            href="/selling/with-certified-broker"
            className="block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-premium-gold/40 hover:bg-white/[0.05]"
          >
            <h2 className="text-lg font-semibold text-white">Sell with a certified broker</h2>
            <p className="mt-2 text-sm text-[#B3B3B3]">
              Full-service listing with a certified professional — valuations, negotiations, compliance, and paperwork
              handled end-to-end.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-premium-gold">Learn more →</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
