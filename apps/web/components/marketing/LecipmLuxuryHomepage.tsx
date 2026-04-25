import Link from "next/link";
import { Suspense } from "react";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";
import { LecipmHomeSearchPanel } from "@/components/marketing/LecipmHomeSearchPanel";
import { RecommendedForYouHomeSection } from "@/components/recommendations/RecommendedForYouHomeSection";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";
import { ShieldCheck, Leaf, Brain, Search as SearchIcon, TrendingUp, ChevronRight, ArrowRight } from "lucide-react";
import { GreenValueStrip } from "@/components/green/GreenValueStrip";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const hubs = [
  {
    title: "Buyer Hub",
    description: "Discover exceptional properties with a premium search experience.",
    href: "/dashboard/buyer",
  },
  {
    title: "Seller Hub",
    description: "Manage listings, leads, and documents with precision.",
    href: "/dashboard/seller",
  },
  {
    title: "Rent Hub",
    description: "Explore long-term rentals with clarity and confidence.",
    href: "/rent",
  },
  {
    title: "BNHub",
    description: "Luxury short-term stays, elevated by intelligent tools.",
    href: "/bnhub/stays",
  },
  {
    title: "Broker Hub",
    description: "High-performance lead, client, and deal management.",
    href: "/dashboard/broker",
  },
  {
    title: "Investor Hub",
    description: "Track opportunities, performance, and risk in one place.",
    href: "/dashboard/investor",
  },
] as const;

const featuredListings = [
  {
    title: "Modern Villa in Westmount",
    price: "$3,750,000",
    location: "Westmount, Montréal",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Downtown Luxury Penthouse",
    price: "$2,490,000",
    location: "Ville-Marie, Montréal",
    image:
      "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Lakeside Prestige Estate",
    price: "$1,150,000",
    location: "Laval-sur-le-Lac, Québec",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80",
  },
] as const;

const insights = [
  {
    title: "Market Trends",
    text: "Track premium zones, demand shifts, and pricing momentum.",
  },
  {
    title: "Risk Alerts",
    text: "Surface abnormal activity, payout anomalies, and weak signals.",
  },
  {
    title: "Investor Signals",
    text: "Highlight high-opportunity assets and strategic entry points.",
  },
] as const;

type Props = {
  locale?: string;
  country?: string;
};

function Navbar({ base }: { base: string }) {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <LecipmBrandLockup href={`${base}/`} variant="dark" density="compact" className="shrink-0" />

        <nav className="hidden items-center gap-8 text-sm text-white/80 lg:flex">
          <Link href={`${base}/listings`} className="transition hover:text-[#D4AF37]">
            Buy
          </Link>
          <Link href={`${base}/rent`} className="transition hover:text-[#D4AF37]">
            Rent
          </Link>
          <Link href={`${base}/bnhub/stays`} className="transition hover:text-[#D4AF37]">
            BNHub
          </Link>
          <Link href={`${base}/dashboard/broker`} className="transition hover:text-[#D4AF37]">
            Brokers
          </Link>
          <Link href={`${base}/dashboard/investor`} className="transition hover:text-[#D4AF37]">
            Invest
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href={`${base}/auth/login`}
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/85 backdrop-blur transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
          >
            Sign in
          </Link>
          <Link
            href={`${base}/signup`}
            className="rounded-full border border-[#D4AF37]/70 bg-[#D4AF37] px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

function SearchPanel() {
  return (
    <div className="w-full max-w-4xl rounded-[30px] border border-[#D4AF37]/20 bg-black/45 p-4 shadow-[0_0_80px_rgba(212,175,55,0.14)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="flex-1 rounded-[22px] border border-white/10 bg-white/5 px-5 py-4">
          <div className="mb-1 text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/80">Search</div>
          <input
            type="search"
            name="q"
            autoComplete="off"
            placeholder="Search by city, address, or listing ID"
            className="w-full bg-transparent text-base text-white placeholder:text-white/35 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:w-[320px] lg:grid-cols-3">
          {["Buy", "Rent", "BNHub"].map((item, index) => (
            <span
              key={item}
              className={`rounded-[20px] border px-4 py-4 text-center text-sm ${
                index === 0
                  ? "border-[#D4AF37]/70 bg-[#D4AF37] text-black"
                  : "border-white/10 bg-white/5 text-white"
              }`}
            >
              {item}
            </span>
          ))}
          <button
            type="button"
            className="col-span-2 rounded-[20px] border border-[#D4AF37]/50 bg-transparent px-4 py-4 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10 lg:col-span-1"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      {eyebrow ? (
        <div className="mb-3 text-[11px] uppercase tracking-[0.36em] text-[#D4AF37]/80">{eyebrow}</div>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h2>
      {subtitle ? (
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">{subtitle}</p>
      ) : null}
    </div>
  );
}

function HubCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[28px] border border-[#D4AF37]/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/45 hover:shadow-[0_0_60px_rgba(212,175,55,0.12)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_35%)] opacity-0 transition group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-6 h-12 w-12 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10" />
        <h3 className="text-xl font-medium text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-white/60">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-[#D4AF37]">
          Explore <span aria-hidden>→</span>
        </div>
      </div>
    </Link>
  );
}

function FeaturedCard({
  title,
  price,
  location,
  image,
  listingsHref,
}: {
  title: string;
  price: string;
  location: string;
  image: string;
  listingsHref: string;
}) {
  return (
    <div className="group overflow-hidden rounded-[30px] border border-white/8 bg-[#0B0B0B]">
      <div
        className="h-72 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="border-t border-white/6 p-6">
        <div className="text-sm uppercase tracking-[0.26em] text-[#D4AF37]/70">Featured</div>
        <h3 className="mt-3 text-2xl font-medium text-white">{title}</h3>
        <p className="mt-2 text-sm text-white/55">{location}</p>
        <div className="mt-6 flex items-center justify-between">
          <div className="text-2xl font-semibold text-[#D4AF37]">{price}</div>
          <Link
            href={listingsHref}
            className="rounded-full border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[#0D0D0D] p-7">
      <div className="mb-5 h-14 rounded-2xl border border-[#D4AF37]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.18),rgba(255,255,255,0.02))]" />
      <h3 className="text-xl font-medium text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/60">{text}</p>
    </div>
  );
}

/** Black / gold luxury marketing homepage — locale- and country-aware links. */
export function LecipmLuxuryHomepage({ locale = routing.defaultLocale, country = DEFAULT_COUNTRY_SLUG }: Props) {
  const base = `/${locale}/${country}`;

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar base={base} />

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1800&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.68),rgba(0,0,0,0.82),#000)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12),transparent_38%)]" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-7xl items-center px-6 pb-24 pt-36 lg:px-10">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex rounded-full border border-[#D4AF37]/25 bg-black/35 px-5 py-2 text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/85 backdrop-blur">
              Luxury Real Estate Intelligence
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight text-white md:text-7xl">
              Where Real Estate
              <span className="block text-[#D4AF37]">Meets Intelligence.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-white/68 md:text-lg">
              Search, invest, and manage through a premium platform designed for discovery, control, and high-value
              decision-making.
            </p>

            {/* Green Hook */}
            <div className="mt-12 p-8 bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-[2.5rem] relative overflow-hidden group max-w-3xl">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <Leaf className="w-16 h-16 text-[#22c55e]" />
              </div>
              <div className="relative z-10 space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-white">Find smarter homes with hidden value</h2>
                <p className="text-gray-400 font-medium">
                  See which properties are already efficient — and which ones you can improve.
                </p>
                <div className="pt-4 flex gap-4">
                  <Link href={`${base}/listings?filter=green`} className="text-[10px] font-black uppercase tracking-widest text-[#22c55e] flex items-center gap-2 hover:translate-x-1 transition-transform">
                    Explore smart homes <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <LecipmHomeSearchPanel base={base} />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/55">
              <span>Premium listings</span>
              <span className="h-1 w-1 rounded-full bg-[#D4AF37]" />
              <span>Investor intelligence</span>
              <span className="h-1 w-1 rounded-full bg-[#D4AF37]" />
              <span>Broker & host workflows</span>
            </div>
          </div>
        </div>
      </section>

      <GreenValueStrip />

      <section className="relative px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Platform"
            title="Six Hubs. One Elevated Experience."
            subtitle="Each hub has its own character, but all of them carry the same LECIPM black-and-gold luxury DNA."
          />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {hubs.map((hub) => (
              <HubCard key={hub.title} {...hub} href={`${base}${hub.href}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Showcase"
            title="Featured Properties"
            subtitle="A curated presentation of premium homes, investment opportunities, and exceptional residences."
          />

          <div className="grid gap-7 xl:grid-cols-3">
            {featuredListings.map((listing) => (
              <FeaturedCard key={listing.title} {...listing} listingsHref={`${base}/listings`} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href={`${base}/listings`}
              className="inline-flex rounded-full border border-[#D4AF37]/50 px-6 py-3 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
            >
              View All Listings
            </Link>
          </div>
        </div>
      </section>

      {/* Smart Opportunities (Green Listings) */}
      <section className="relative px-6 py-24 lg:px-10 bg-[#22c55e]/5">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Intelligence"
            title="Smart Opportunities"
            subtitle="Properties identified by Green AI with significant hidden value or exceptional efficiency."
          />

          <div className="grid gap-7 xl:grid-cols-3">
             {[
               { title: "Eco-Conscious Loft", label: "OPTIMIZED", color: "#22c55e", rationale: "Already highly efficient" },
               { title: "Hidden Value Estate", label: "IMPROVABLE", color: "#D4AF37", rationale: "Good potential for improvement" },
               { title: "Energy-Ready Condo", label: "READY", color: "#3b82f6", rationale: "Minor updates needed for peak efficiency" }
             ].map((item, i) => (
               <div key={i} className="group overflow-hidden rounded-[30px] border border-[#22c55e]/20 bg-black p-8 space-y-6 relative hover:border-[#22c55e]/40 transition-all shadow-xl">
                  <div className="flex justify-between items-start">
                     <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                        <Leaf className="w-6 h-6 text-[#22c55e]" />
                     </div>
                     <Badge className="font-black text-[10px]" style={{ backgroundColor: `${item.color}10`, color: item.color, borderColor: `${item.color}30` }}>
                        {item.label}
                     </Badge>
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-white">{item.title}</h3>
                     <p className="text-sm text-gray-500 italic">"{item.rationale}"</p>
                  </div>
                  <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                     <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Green AI Verified</span>
                     <Link href={`${base}/listings`} className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-[#22c55e] group-hover:text-black transition-all">
                        <ArrowRight className="w-4 h-4" />
                     </Link>
                  </div>
               </div>
             ))}
          </div>

          <div className="mt-12 text-center">
            <Button className="bg-[#22c55e] text-black h-14 px-10 rounded-full font-black text-xs tracking-widest uppercase hover:brightness-110">
               Explore smart homes
            </Button>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <RecommendedForYouHomeSection base={base} locale={locale} country={country} />
      </Suspense>

      <section className="relative px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Intelligence"
            title="AI-Powered Insights"
            subtitle="Move beyond static listings with signals designed to support decisions, surface patterns, and elevate platform trust."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {insights.map((item) => (
              <InsightCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 py-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[34px] border border-[#D4AF37]/16 bg-[#0B0B0B] p-8">
            <div className="mb-3 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">For Investors</div>
            <h3 className="text-3xl font-semibold text-white">Track performance and uncover high-conviction opportunities.</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
              Portfolio visibility, AI-driven opportunity signals, and risk-aware analytics built for a premium
              investment experience.
            </p>
            <div className="mt-8">
              <Link
                href={`${base}/dashboard/investor`}
                className="inline-flex rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-medium text-black transition hover:brightness-110"
              >
                Explore Investor Hub
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[34px] border border-[#D4AF37]/16 bg-[#0B0B0B] p-8">
            <div className="mb-3 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">For Brokers</div>
            <h3 className="text-3xl font-semibold text-white">Grow your pipeline with a more intelligent client engine.</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
              Lead quality, performance analytics, and elegant workflow tools designed for serious real estate professionals.
            </p>
            <div className="mt-8">
              <Link
                href={`${base}/dashboard/broker`}
                className="inline-flex rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-medium text-black transition hover:brightness-110"
              >
                Explore Broker Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[38px] border border-premium-gold/20 bg-gradient-to-br from-zinc-950 to-black p-10 md:p-16 overflow-hidden relative">
            <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/3 -translate-y-1/3 bg-premium-gold/5 blur-[120px]" />
            
            <div className="max-w-3xl relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-premium-gold/30 bg-premium-gold/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-premium-gold">
                <ShieldCheck className="h-3 w-3" />
                Québec Trust Hub
              </div>
              
              <h2 className="text-4xl font-semibold tracking-tight text-white md:text-5xl leading-tight">
                Un parcours de rédaction <span className="text-premium-gold">plus clair</span>, plus transparent et mieux encadré.
              </h2>
              
              <p className="mt-8 text-lg leading-8 text-neutral-400">
                LECIPM aide les utilisateurs à comprendre les clauses, vérifier les risques, suivre les avis importants et préparer des documents plus clairs avant signature.
              </p>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Score de Conformité</h4>
                  <p className="text-sm text-neutral-500 italic">Évaluation dynamique de la complétude et des risques de vos brouillons.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Avis OACIQ-Ready</h4>
                  <p className="text-sm text-neutral-500 italic">Divulgations obligatoires et avis de protection intégrés nativement.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Broker Assist</h4>
                  <p className="text-sm text-neutral-500 italic">Accès direct à une révision professionnelle pour vos transactions complexes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-24 pt-10 lg:px-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[38px] border border-[#D4AF37]/18 bg-[linear-gradient(135deg,#0D0D0D,#080808)] p-10 text-center shadow-[0_0_120px_rgba(212,175,55,0.08)] md:p-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#D4AF37]/82">LECIPM</div>
            <h2 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Join the Future of Real Estate.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
              Enter a platform designed to feel premium, move intelligently, and scale across buying, renting, hosting,
              brokering, and investing.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={`${base}/signup`}
                className="rounded-full bg-[#D4AF37] px-7 py-3.5 text-sm font-medium text-black transition hover:brightness-110"
              >
                Get Started
              </Link>
              <Link
                href={`${base}/listings`}
                className="rounded-full border border-[#D4AF37]/45 px-7 py-3.5 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
              >
                Explore Properties
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
