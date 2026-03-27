import type { Metadata } from "next";
import Link from "next/link";
import {
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_NAME,
  platformBrandGoldTextClass,
  platformCarrefourGoldGradientClass,
} from "@/lib/brand/platform";
import { LeadCTA } from "@/components/ui/LeadCTA";

export const metadata: Metadata = {
  title: { absolute: "Why LECIPM" },
  description:
    "Quebec-focused real estate, short stays, and property services. Licensed broker support, secure payments, OACIQ-minded professionalism. Montreal, Laval, Quebec.",
  keywords: [
    "Quebec real estate broker",
    "Montreal real estate broker",
    "Laval real estate broker",
    "sell property Quebec",
    "free property evaluation",
    PLATFORM_CARREFOUR_NAME,
    PLATFORM_NAME,
  ],
  openGraph: {
    title: "Why LECIPM",
    description: "Where Prestige Meets Smart Real Estate — Québec-focused platform for property services.",
  },
};

const CARDS = [
  {
    title: "Quebec-focused platform",
    body: "Built for Montreal, Laval, and Quebec markets — local context, not generic listings.",
  },
  {
    title: "Licensed broker support",
    body: "Work with an OACIQ-regulated professional when you want representation and pricing clarity.",
  },
  {
    title: "Secure payments & transparency",
    body: "BNHub and platform flows designed for clear fees, receipts, and a professional checkout experience.",
  },
  {
    title: "All-in-one property ecosystem",
    body: "FSBO tools, broker services, and short-stay booking tech together — fewer tabs, more clarity.",
  },
] as const;

export default function WhyLecipmPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <p className={`mx-auto max-w-2xl text-[11px] font-semibold uppercase leading-snug tracking-[0.14em] sm:text-xs ${platformBrandGoldTextClass}`}>
            {PLATFORM_NAME}
          </p>
          <p className={`mx-auto mt-1 max-w-2xl text-center text-sm font-medium leading-snug ${platformBrandGoldTextClass}`}>
            {PLATFORM_CARREFOUR_NAME}
          </p>
          <h1 className="font-serif mt-5 text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Why choose <span className={platformBrandGoldTextClass}>{PLATFORM_NAME}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[#B3B3B3]">
            A Quebec-focused platform for real estate, short stays, and smart property services.
          </p>
          <div className="mx-auto mt-10 max-w-2xl">
            <LeadCTA variant="broker" trustMicrocopy />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-xl font-bold text-white sm:text-2xl">Key advantages</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-[#C9A646]/25 bg-[#121212] p-6 shadow-lg transition hover:-translate-y-0.5 hover:border-[#C9A646]/45"
            >
              <h3 className="text-lg font-semibold text-[#C9A646]">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#121212]/60 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-lg font-medium leading-relaxed text-white sm:text-xl">
            <span className={platformCarrefourGoldGradientClass}>{PLATFORM_CARREFOUR_NAME}</span> combines direct listing
            tools, trusted broker support, and premium booking technology in one platform.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-xl font-bold text-white">Trust &amp; authority</h2>
        <ul className="mt-8 space-y-4 text-sm text-[#B3B3B3]">
          <li className="flex gap-3 rounded-xl border border-white/10 bg-[#121212] p-4">
            <span className="text-[#C9A646]">●</span>
            <span>
              <strong className="text-white">OACIQ context</strong> — brokerage is regulated in Québec; we present licensed
              support clearly and professionally.
            </span>
          </li>
          <li className="flex gap-3 rounded-xl border border-white/10 bg-[#121212] p-4">
            <span className="text-[#C9A646]">●</span>
            <span>
              <strong className="text-white">Local Quebec identity</strong> — product and copy tuned for sellers, buyers,
              and hosts in the province.
            </span>
          </li>
          <li className="flex gap-3 rounded-xl border border-white/10 bg-[#121212] p-4">
            <span className="text-[#C9A646]">●</span>
            <span>
              <strong className="text-white">Verified hosts &amp; brokers</strong> — professional flows and verification
              paths where it matters for trust.
            </span>
          </li>
          <li className="flex gap-3 rounded-xl border border-white/10 bg-[#121212] p-4">
            <span className="text-[#C9A646]">●</span>
            <span>
              <strong className="text-white">Secure checkout</strong> — payments and receipts handled with transparency
              for BNHub and platform services.
            </span>
          </li>
        </ul>
      </section>

      <section className="border-t border-[#C9A646]/20 bg-[#0B0B0B] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Ready to talk?</h2>
          <p className="mt-3 text-sm text-[#737373]">
            Get my FREE consultation · Call now · WhatsApp — no obligation.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <LeadCTA variant="consultation" />
          </div>
          <p className="mt-10 text-xs text-[#525252]">
            FSBO and BNHub flows are unchanged — explore{" "}
            <Link href="/sell" className="text-[#C9A646] hover:underline">
              FSBO
            </Link>{" "}
            or{" "}
            <Link href="/bnhub" className="text-[#C9A646] hover:underline">
              BNHub
            </Link>{" "}
            anytime.
          </p>
        </div>
      </section>
    </main>
  );
}
