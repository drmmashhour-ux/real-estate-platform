import type { Metadata } from "next";
import Link from "next/link";
import { BrandGuidelineStrip } from "@/components/brand/BrandGuidelineStrip";
import { BrandAssetPlaceholder } from "@/components/brand/BrandAssetPlaceholder";
import { getPublicMortgageExpertsList } from "@/modules/mortgage/services/public-experts";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

export const dynamic = "force-dynamic";

const path = "/professionals";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteBaseUrl();
  const url = `${base}${path}`;
  return {
    title: "Professional network hub",
    description:
      "Trusted brokers, mortgage experts, and transaction partners in one network hub for referrals, introductions, and local property services.",
    alternates: { canonical: url },
    openGraph: {
      title: "Professional network hub | LECIPM",
      description:
        "An Alignable-style foundation for real estate professionals, mortgage experts, and transaction partners.",
      url,
      type: "website",
    },
  };
}

const partnerLanes = [
  {
    title: "Mortgage experts",
    desc: "Pre-approval, refinancing, affordability planning, and financing strategy.",
    href: "/mortgage",
    cta: "Open mortgage hub",
  },
  {
    title: "Licensed brokers",
    desc: "Buying strategy, negotiation, listing support, and local market guidance.",
    href: "/join-broker",
    cta: "Explore broker path",
  },
  {
    title: "Notaries & legal support",
    desc: "Closing coordination, deed readiness, legal review, and transaction completion support.",
    href: "/contact",
    cta: "Request legal partner intro",
  },
  {
    title: "Inspectors & valuation partners",
    desc: "Property inspection, condition verification, value context, and due-diligence support.",
    href: "/appraisal-calculator",
    cta: "Open valuation tools",
  },
  {
    title: "Contractors, stagers, photographers",
    desc: "Presentation, renovation planning, media production, and listing performance improvement.",
    href: "/start-listing",
    cta: "Open seller launch flow",
  },
  {
    title: "Referral partners",
    desc: "Local businesses and ecosystem partners who can refer buyers, sellers, and investors into the platform.",
    href: "/invite",
    cta: "Open referral system",
  },
] as const;

const differentiators = [
  "Built around real property transactions, not generic business networking.",
  "Combines trust, verification, finance, legal, and listing workflows in one place.",
  "Can route a lead from discovery to notary-ready transaction instead of stopping at introductions.",
] as const;

const networkBlueprint = [
  "Verified public profiles for each professional category with specialties, city focus, ratings, and response paths.",
  "Referral loops between brokers, mortgage experts, and local service partners with visible trust and conversion signals.",
  "Local discovery by city so users can find professionals near the property, not just near the user.",
  "Future recommendation layer where professionals endorse each other and request warm introductions.",
] as const;

const brokerIdentity = {
  name: "Mohamed Al Mashhour",
  title: "Residential Real Estate Broker",
  brand: "Le Carrefour Immobilier Prestige",
  license: "License No. # 1321 Quebec",
  office: "207-805 boul. Chomedey, Laval, QC H7V 0B1",
  phone: "(514) 462-4457",
  email: "dr.m.mashhour@gmail.com",
  website: "www.mashhourinvestments.com",
} as const;

export default async function ProfessionalsPage() {
  const mortgageExperts = (await getPublicMortgageExpertsList()).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,#2c2208,transparent_32%),linear-gradient(180deg,#0b0b0b,#101014)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-premium-gold">Professional network hub</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            A real-estate-first network for trusted professionals, referrals, and local deal partners.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
            Alignable proves that trust and referrals matter. This platform goes further by connecting professionals directly
            to live property workflows: buyers, sellers, listings, financing, legal steps, and transaction completion.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/mortgage"
              className="rounded-full bg-premium-gold px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Start with live experts
            </Link>
            <Link
              href="/financial-hub"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
            >
              Open financial hub
            </Link>
            <Link
              href="/invite"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
            >
              Open referral engine
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-3">
            {differentiators.map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-relaxed text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <BrandGuidelineStrip />
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr,1fr]">
          <div className="rounded-3xl border border-premium-gold/20 bg-[radial-gradient(circle_at_top,#2a2108,transparent_34%),linear-gradient(180deg,#0d0d0d,#111111)] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Broker flagship profile</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Professional identity with real broker information</h2>
            <div className="mt-6 rounded-3xl border border-premium-gold/30 bg-black/30 p-6">
              <p className="text-xl font-semibold text-premium-gold">{brokerIdentity.name}</p>
              <p className="mt-2 text-sm text-slate-100">{brokerIdentity.title}</p>
              <p className="mt-1 text-sm text-slate-400">{brokerIdentity.brand}</p>
              <p className="mt-4 text-sm text-white">{brokerIdentity.license}</p>
              <div className="mt-5 space-y-2 text-sm text-slate-300">
                <p>{brokerIdentity.office}</p>
                <p>{brokerIdentity.phone}</p>
                <p>{brokerIdentity.email}</p>
                <p>{brokerIdentity.website}</p>
              </div>
              <Link href="/broker/mohamed-al-mashhour" className="mt-5 inline-block text-sm font-semibold text-premium-gold hover:underline">
                Open broker profile →
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">App-tracking direction</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Phone-based building and listing tracking</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Your reference visuals show a premium mobile workflow. That is a strong direction for the broker side of the
              platform: listings, maps, contact actions, and partner coordination in a phone-first operating system.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Listing tracking</p>
                <p className="mt-2 text-sm text-slate-400">Track buildings, asking prices, contacts, and follow-up status on the go.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Map workflow</p>
                <p className="mt-2 text-sm text-slate-400">Connect mobile map views to property discovery and broker action paths.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Field operations</p>
                <p className="mt-2 text-sm text-slate-400">Use the same hub for visits, notes, outreach, and warm partner introductions.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Luxury presentation</p>
                <p className="mt-2 text-sm text-slate-400">Keep the black, gold, and premium-operator design language across public and broker pages.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Brand showcase</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Approved public-facing brand assets</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
              These assets are now part of the professional network presentation and should be reused consistently for broker and
              partner trust surfaces.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <BrandAssetPlaceholder
              title="Platform logo showcase"
              subtitle="Reserved for the final exported LECIPM logo or signature hero brand visual."
              formatHint="SVG preferred"
              imageSrc="/branding/lecipm-logo-gold.png"
              imageAlt="LECIPM logo showcase"
            />
            <BrandAssetPlaceholder
              title="Broker identity card"
              subtitle="Reserved for the clean broker card visual with your photo, license, office, and contact details."
              formatHint="PNG recommended"
              imageSrc="/branding/mohamed-broker-card.png"
              imageAlt="Broker identity card"
            />
            <BrandAssetPlaceholder
              title="App and building tracking visual"
              subtitle="Reserved for the mobile UI or dashboard visual that presents the property-tracking workflow."
              formatHint="PNG or WebP"
              imageSrc="/branding/mohamed-skyline.png"
              imageAlt="Building and broker showcase visual"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">First network lanes</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Professionals by role</h2>
            </div>
            <p className="max-w-2xl text-sm text-slate-400">
              This is the first public version of the network layer: structured lanes for the professionals that matter most in
              a property transaction.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {partnerLanes.map((lane) => (
              <div key={lane.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-xl font-semibold text-white">{lane.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{lane.desc}</p>
                <Link href={lane.href} className="mt-5 inline-block text-sm font-semibold text-premium-gold hover:underline">
                  {lane.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Live directory</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Featured mortgage experts already on-platform</h2>
            </div>
            <Link href="/experts" className="text-sm font-semibold text-premium-gold hover:underline">
              Open full expert directory →
            </Link>
          </div>

          {mortgageExperts.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">Experts will appear here once onboarded and verified.</p>
          ) : (
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {mortgageExperts.map((expert) => (
                <div key={expert.id} className="rounded-3xl border border-premium-gold/20 bg-white/[0.03] p-6">
                  <div className="flex flex-wrap gap-2">
                    {expert.badges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border border-premium-gold/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-premium-gold"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">{expert.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{expert.title || expert.company || "Mortgage specialist"}</p>
                  <p className="mt-3 text-sm text-slate-300">
                    ★ {expert.rating.toFixed(1)} · {expert.reviewCount} reviews · {expert.totalDeals} deals
                  </p>
                  {expert.bio ? <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-400">{expert.bio}</p> : null}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/mortgage?expert=${encodeURIComponent(expert.id)}`}
                      className="rounded-full bg-premium-gold px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
                    >
                      Request intro
                    </Link>
                    <Link
                      href="/experts"
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
                    >
                      View directory
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Roadmap from here</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">How this becomes stronger than Alignable for real estate</h2>
            <div className="mt-6 space-y-3">
              {networkBlueprint.map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-slate-300">
                  Step {index + 1}: {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Call to action</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Join or use the network</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Whether you are a buyer, seller, broker, or partner business, the goal is the same: move from cold contact to
              trusted introduction and then into a real transaction workflow.
            </p>
            <div className="mt-6 space-y-3">
              <Link href="/join-broker" className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-premium-gold/30">
                <p className="text-sm font-semibold text-white">Join as broker</p>
                <p className="mt-1 text-sm text-slate-400">For listing representation, buyer support, and local market partnership.</p>
              </Link>
              <Link href="/auth/signup-expert" className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-premium-gold/30">
                <p className="text-sm font-semibold text-white">Join as mortgage expert</p>
                <p className="mt-1 text-sm text-slate-400">For financing referrals, pre-approvals, and deal support.</p>
              </Link>
              <Link href="/contact" className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-premium-gold/30">
                <p className="text-sm font-semibold text-white">Apply as partner business</p>
                <p className="mt-1 text-sm text-slate-400">For notaries, inspectors, photographers, contractors, and related services.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
