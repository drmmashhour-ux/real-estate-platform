import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL, getSupportPhoneDisplay, getSupportTelHref } from "@/lib/config/contact";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand/platform";
import { LeadCTA } from "@/components/ui/LeadCTA";

const BROKER_PHONE_DISPLAY = "+1 514 462 4457";
const TEL = "tel:+15144624457";
const WA = "https://wa.me/15144624457";

export const metadata: Metadata = {
  title: { absolute: "Mohamed Al Mashhour | Residential Real Estate Broker J1321" },
  description:
    "Licensed Quebec real estate broker (OACIQ). Selling, buying, negotiation, and market analysis. FREE consultation & AI property evaluation. Montreal & Quebec.",
  keywords: [
    "Quebec real estate broker",
    "Montreal real estate broker",
    "Laval real estate broker",
    "sell property Quebec",
    "free property evaluation",
    "Mohamed Al Mashhour",
    "J1321",
  ],
};

const SERVICES = [
  { title: "Selling support", body: "Pricing strategy, prep, and exposure so your listing competes." },
  { title: "Buying support", body: "Clear tours, offers, and conditions aligned with your goals." },
  { title: "Negotiation", body: "Calm, documented negotiation backed by market context." },
  { title: "Market analysis", body: "Data-driven comparables and realistic ranges." },
  { title: "Investment guidance", body: "High-level investment framing alongside regulated brokerage work." },
  { title: "Transaction support", body: "Contract timelines, referrals, and coordination with professionals." },
] as const;

export default function MohamedAlMashhourPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
          <span className="inline-flex rounded-full border border-premium-gold/40 bg-premium-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-premium-gold">
            Verified Broker
          </span>
          <h1 className="mt-6 font-bold tracking-tight text-white" style={{ fontSize: "clamp(1.75rem, 5vw, 2.75rem)" }}>
            Mohamed Al Mashhour
          </h1>
          <p className="mt-2 text-lg text-premium-gold">Residential Real Estate Broker</p>
          <p className="mt-1 text-sm text-[#B3B3B3]">License J1321</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={TEL}
              className="inline-flex rounded-xl bg-premium-gold px-6 py-3 text-sm font-bold text-[#0B0B0B] hover:bg-premium-gold"
            >
              Call now
            </a>
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl border border-premium-gold/50 px-6 py-3 text-sm font-semibold text-premium-gold hover:bg-premium-gold/10"
            >
              WhatsApp
            </a>
            <Link
              href="/sell#sell-consultation"
              className="inline-flex rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              Request consultation
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-premium-gold/30 bg-[#121212]">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="relative aspect-[4/5] max-h-[420px] w-full md:max-h-none">
              <Image
                src="/images/broker.jpg"
                alt="Mohamed Al Mashhour"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="flex flex-col justify-center p-8 md:p-10">
              <h2 className="text-xl font-bold text-white">About</h2>
              <p className="mt-4 text-sm leading-relaxed text-[#B3B3B3]">
                I work with sellers and buyers across Québec with a focus on clarity, local market knowledge, and
                professional execution. Whether you are listing, buying, or weighing an investment, you get structured
                guidance — not noise.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[#B3B3B3]">
                {PLATFORM_CARREFOUR_NAME} blends self-serve FSBO tools with broker support when you want representation.
                My role is to help you sell faster and buy smarter, with contracts and compliance handled to a
                professional standard.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-center text-xl font-bold text-white sm:text-2xl">Services</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-white/10 bg-[#121212] p-5 transition hover:-translate-y-0.5 hover:border-premium-gold/35"
            >
              <h3 className="font-semibold text-premium-gold">{s.title}</h3>
              <p className="mt-2 text-sm text-[#B3B3B3]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#121212]/50 py-14">
        <div className="mx-auto max-w-3xl rounded-2xl border border-premium-gold/25 bg-[#0B0B0B] px-6 py-10 text-center sm:px-10">
          <h2 className="text-xl font-bold text-premium-gold sm:text-2xl">Free value</h2>
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-[#B3B3B3]">
            <li className="flex gap-2">
              <span className="text-premium-gold">✓</span> FREE consultation
            </li>
            <li className="flex gap-2">
              <span className="text-premium-gold">✓</span> FREE AI property evaluation
            </li>
            <li className="flex gap-2">
              <span className="text-premium-gold">✓</span> No obligation
            </li>
          </ul>
          <div className="mx-auto mt-8 max-w-lg">
            <LeadCTA variant="evaluation" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
        <h2 className="text-lg font-bold text-white">Contact</h2>
        <div className="mt-6 space-y-2 text-sm text-[#B3B3B3]">
          <p>
            <a href={TEL} className="text-white hover:text-premium-gold">
              {BROKER_PHONE_DISPLAY}
            </a>
          </p>
          <p>
            <a href={getSupportTelHref()} className="hover:text-premium-gold">
              {getSupportPhoneDisplay()}
            </a>
            <span className="block text-xs text-[#737373]">Platform line</span>
          </p>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-premium-gold hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
        <Link href="/why-lecipm" className="mt-10 inline-block text-sm text-[#737373] hover:text-premium-gold">
          Why {PLATFORM_NAME} →
        </Link>
      </section>
    </main>
  );
}
