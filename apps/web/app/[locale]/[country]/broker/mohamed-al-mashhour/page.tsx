import type { Metadata } from "next";
import { FsboListingOwnerType } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { BrandAssetPlaceholder } from "@/components/brand/BrandAssetPlaceholder";
import { BrandGuidelineStrip } from "@/components/brand/BrandGuidelineStrip";
import { BrokerListingShortGrid } from "@/components/broker/BrokerListingShortGrid";
import { CONTACT_EMAIL, getSupportPhoneDisplay, getSupportTelHref } from "@/lib/config/contact";
import { getPublicListingsForOwner, resolveShowcaseBrokerUserId } from "@/lib/broker/public-showcase-listings";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand/platform";
import { LeadCTA } from "@/components/ui/LeadCTA";

const BROKER_PHONE_DISPLAY = "+1 (844) 441-5444";
const TEL = "tel:+18444415444";
const WA = "https://wa.me/18444415444";
const BROKER_LICENSE_LABEL = "License No. # 1321 Quebec";
const BROKER_OFFICE = "207-805 Boul. Chomedey – Laval, QC H7V 0B1";
const BROKER_CARD_EMAIL = "info@mashhourinvestments.com";
const BROKER_CARD_WEBSITE = "www.mashhourinvestments.com";

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

export default async function MohamedAlMashhourPage() {
  const showcaseBrokerId = await resolveShowcaseBrokerUserId();
  const brokerListings =
    showcaseBrokerId != null
      ? await getPublicListingsForOwner({
          ownerId: showcaseBrokerId,
          ownerRole: FsboListingOwnerType.BROKER,
          take: 24,
        })
      : [];

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
            <div className="relative aspect-[4/5] max-h-[420px] w-full bg-black md:max-h-none">
              <Image
                src="/branding/mohamed-portrait.png"
                alt="Mohamed Al Mashhour"
                fill
                className="object-contain object-top"
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

      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-3xl border border-premium-gold/25 bg-[radial-gradient(circle_at_top,#2a2108,transparent_35%),linear-gradient(180deg,#0d0d0d,#111111)] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Broker identity</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Professional card details on-platform</h2>
            <div className="mt-6 rounded-3xl border border-premium-gold/30 bg-black/30 p-6">
              <p className="text-lg font-semibold text-premium-gold">Mohamed Al Mashhour</p>
              <p className="mt-2 text-sm text-slate-200">Residential Real Estate Broker</p>
              <p className="mt-1 text-sm text-slate-400">{PLATFORM_CARREFOUR_NAME}</p>
              <p className="mt-4 text-sm text-white">{BROKER_LICENSE_LABEL}</p>
              <div className="mt-5 space-y-2 text-sm text-slate-300">
                <p>{BROKER_OFFICE}</p>
                <p>
                  <a href={TEL} className="hover:text-premium-gold">
                    {BROKER_PHONE_DISPLAY}
                  </a>
                </p>
                <p>
                  <a href={`mailto:${BROKER_CARD_EMAIL}`} className="hover:text-premium-gold">
                    {BROKER_CARD_EMAIL}
                  </a>
                </p>
                <p>
                  <a href={`https://${BROKER_CARD_WEBSITE}`} target="_blank" rel="noopener noreferrer" className="hover:text-premium-gold">
                    {BROKER_CARD_WEBSITE}
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#121212] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Platform + mobile tracking</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Real estate broker platform with field visibility</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              The design direction in your images clearly points to a black-and-gold broker operating system with phone-based
              property tracking. This platform can present that identity as a premium broker workspace, not only a listing site.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Mobile lead tracking</p>
                <p className="mt-2 text-sm text-slate-400">
                  Follow listing activity, buyer contact, and response speed from a phone-friendly interface.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Property map visibility</p>
                <p className="mt-2 text-sm text-slate-400">
                  Connect listings, locations, and field activity into one broker dashboard for faster action.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Premium broker identity</p>
                <p className="mt-2 text-sm text-slate-400">
                  Present your license, office, direct phone, and brand in a more serious luxury-operator style.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Future app layer</p>
                <p className="mt-2 text-sm text-slate-400">
                  This can evolve into a full mobile-first broker app for tracking buildings, visits, and partner coordination.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <BrandAssetPlaceholder
            title="Broker logo / wordmark"
            subtitle="Reserved for the clean exported LECIPM logo or broker luxury wordmark from Canva."
            formatHint="SVG or transparent PNG"
            imageSrc="/branding/lecipm-logo-gold.png"
            imageAlt="LECIPM gold logo"
          />
          <BrandAssetPlaceholder
            title="Broker business card"
            subtitle="Reserved for the clean exported broker card with license, office, and direct contact details."
            formatHint="PNG recommended"
            imageSrc="/branding/mohamed-broker-card.png"
            imageAlt="Mohamed Al Mashhour broker card"
          />
          <BrandAssetPlaceholder
            title="Mobile app tracking visual"
            subtitle="Reserved for the exported phone or dashboard visual showing building tracking, maps, or field workflow."
            formatHint="PNG or WebP"
            imageSrc="/branding/mohamed-skyline.png"
            imageAlt="Mohamed Al Mashhour skyline brand visual"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <BrandGuidelineStrip />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <BrokerListingShortGrid
          listings={brokerListings}
          heading="Active listings on LECIPM"
          emptyMessage="No broker-managed public listings yet. When ACTIVE listings are published for this profile, they will appear here with price, location, a short summary, and the listing code."
        />
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
