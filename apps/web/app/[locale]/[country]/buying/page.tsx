import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_NAME } from "@/config/branding";

export const metadata: Metadata = {
  title: "Buying",
  description: `Choose how you want to buy a property on ${PLATFORM_NAME} — on your own or with a platform broker.`,
};

export default function BuyingHubPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Buying</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">How do you want to buy?</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#B3B3B3] sm:text-base">
        Pick the path that fits you. You can browse listings and tools in both cases — the difference is whether you work
        with an assigned platform broker for representation and guidance.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-1">
        <li>
          <Link
            href="/buying/by-yourself"
            className="block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-premium-gold/40 hover:bg-white/[0.05]"
          >
            <h2 className="text-lg font-semibold text-white">Buying by yourself</h2>
            <p className="mt-2 text-sm text-[#B3B3B3]">
              Search listings, compare options, and move forward using the platform tools without a dedicated platform
              broker.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-premium-gold">Learn more →</span>
          </Link>
        </li>
        <li>
          <Link
            href="/buying/with-platform-broker"
            className="block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-premium-gold/40 hover:bg-white/[0.05]"
          >
            <h2 className="text-lg font-semibold text-white">Buying with a platform broker</h2>
            <p className="mt-2 text-sm text-[#B3B3B3]">
              Get matched with a licensed broker on our platform for advice, offers, and paperwork aligned with your
              purchase.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-premium-gold">Learn more →</span>
          </Link>
        </li>
        <li>
          <Link
            href="/buying/with-selected-broker"
            className="block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-premium-gold/40 hover:bg-white/[0.05]"
          >
            <h2 className="text-lg font-semibold text-white">Buying with a selected broker</h2>
            <p className="mt-2 text-sm text-[#B3B3B3]">
              Work with a broker you choose — we help coordinate showings, offers, and paperwork while you keep the
              relationship.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-premium-gold">Learn more →</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
