import Link from "next/link";
import { MainSearchBar } from "@/components/search/MainSearchBar";
import {
  getPublicContactEmail,
  getPublicContactMailto,
  getPublicSocialLinks,
} from "@/lib/marketing-contact";
import { PLATFORM_MODULES } from "@/lib/platform-modules";
import { getPhoneNumber, getPhoneTelLink, hasPhone } from "@/lib/phone";
import { VerifiedBrokerBadge } from "@/components/ui/VerifiedBrokerBadge";

const GOLD = "#D4AF37";
const SURFACE = "#121212";

/** Avoid SSG hanging on self-fetch when no dev server is up during `next build`. */
export const dynamic = "force-dynamic";

const FEATURED_FETCH_MS = 8_000;

async function getFeaturedProjects() {
  if (!process.env.DATABASE_URL) return [];
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FEATURED_FETCH_MS);
  try {
    const res = await fetch(`${base}/api/projects?featuredOnly=true`, {
      next: { revalidate: 60 },
      signal: ac.signal,
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

async function getFeaturedListings() {
  if (!process.env.DATABASE_URL) return [];
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FEATURED_FETCH_MS);
  try {
    const res = await fetch(`${base}/api/bnhub/search?limit=12&page=1`, {
      next: { revalidate: 60 },
      signal: ac.signal,
    });
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

function IconStay() {
  return (
    <svg className="h-6 w-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconBuy() {
  return (
    <svg className="h-6 w-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
function IconInvest() {
  return (
    <svg className="h-6 w-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
function IconList() {
  return (
    <svg className="h-6 w-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}

const QUICK_ACTIONS = [
  { title: "Rent stays", href: "/search/bnhub", sub: "Nightly & short-term", Icon: IconStay },
  { title: "Buy property", href: "/dashboard/real-estate", sub: "Homes & long-term", Icon: IconBuy },
  { title: "Invest", href: "/dashboard/investments", sub: "Projects & yield", Icon: IconInvest },
  { title: "List your property", href: "/bnhub/become-host", sub: "Earn with BNHub", Icon: IconList },
];

type HStripProps = {
  title: string;
  subtitle: string;
  viewAllHref: string;
  viewAllLabel?: string;
  children: React.ReactNode;
};

function HorizontalStrip({ title, subtitle, viewAllHref, viewAllLabel = "View all", children }: HStripProps) {
  return (
    <section className="border-t border-white/10 bg-[#0B0B0B] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
            <p className="mt-2 max-w-xl text-[#B3B3B3]">{subtitle}</p>
          </div>
          <Link
            href={viewAllHref}
            className="btn-secondary shrink-0 rounded-full px-5 py-2.5 text-sm"
          >
            {viewAllLabel}
          </Link>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-thin sm:-mx-0 sm:px-0">
          {children}
        </div>
      </div>
    </section>
  );
}

const LUXURY_PLACEHOLDER = [
  { id: "l1", title: "Sky Residence Collection", city: "Montreal", price: "From $2.4M", img: "https://images.pexels.com/photos/32870/pexels-photo.jpg?auto=compress&w=800" },
  { id: "l2", title: "Harbour Penthouse", city: "Laval", price: "From $1.8M", img: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&w=800" },
  { id: "l3", title: "Estate Vineyard Lane", city: "Laurentians", price: "From $3.1M", img: "https://images.pexels.com/photos/221540/pexels-photo-221540.jpeg?auto=compress&w=800" },
  { id: "l4", title: "Private Summit Lodge", city: "Quebec City", price: "From $1.2M", img: "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&w=800" },
];

const BROKER_CARDS = [
  { name: "Institutional desk", region: "Greater Montreal", href: "/broker" },
  { name: "Luxury advisory", region: "Premium tier", href: "/broker" },
  { name: "Investment sales", region: "Multi-res & land", href: "/dashboard/broker" },
  { name: "Relocation & expat", region: "Concierge", href: "/auth/signup" },
];

export default async function HomePage() {
  const [featuredProjects, featuredListings] = await Promise.all([
    getFeaturedProjects(),
    getFeaturedListings(),
  ]);

  const social = getPublicSocialLinks();
  const socialEntries: Array<[string, string, string]> = [];
  if (social.linkedin) socialEntries.push(["linkedin", "LinkedIn", social.linkedin]);
  if (social.instagram) socialEntries.push(["instagram", "Instagram", social.instagram]);
  if (social.x) socialEntries.push(["x", "X", social.x]);

  const displayListings =
    featuredListings.length >= 4
      ? featuredListings
      : [
          {
            id: "1",
            title: "Waterfront Villa, Palm District",
            city: "Montreal",
            nightPriceCents: 18500,
            photos: ["https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800"],
          },
          {
            id: "2",
            title: "City Center Loft",
            city: "Laval",
            nightPriceCents: 12000,
            photos: ["https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=800"],
          },
          {
            id: "3",
            title: "Cozy Cabin by the Lake",
            city: "Quebec City",
            nightPriceCents: 9500,
            photos: ["https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800"],
          },
          {
            id: "4",
            title: "Downtown Apartment",
            city: "Toronto",
            nightPriceCents: 14000,
            photos: ["https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800"],
          },
        ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white antialiased">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-14 text-center sm:px-6 sm:pt-24">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(212,175,55,0.14),transparent)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(212,175,55,0.08),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl page-enter">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <VerifiedBrokerBadge />
            <span
              className="rounded-full border border-[#D4AF37]/30 px-3 py-1 text-xs font-medium text-[#D4AF37]"
              style={{ backgroundColor: `${SURFACE}` }}
            >
              Secure payments · Stripe
            </span>
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find your perfect stay, investment, or property
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#B3B3B3] sm:text-xl">
            A premium ecosystem for stays, acquisitions, and portfolio growth — vetted opportunities,
            licensed professionals, and seamless payments end to end.
          </p>
          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/search/bnhub"
              className="inline-flex items-center justify-center rounded-full px-10 py-3.5 text-sm font-bold text-[#0B0B0B] shadow-lg transition hover:brightness-110"
              style={{ backgroundColor: GOLD, boxShadow: "0 12px 40px rgba(212,175,55,0.25)" }}
            >
              Explore BNHub stays
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur hover:border-[#D4AF37]/50"
            >
              Open your account
            </Link>
          </div>
          <div className="mx-auto mt-10 w-full max-w-4xl">
            <MainSearchBar />
          </div>

          {/* Quick actions */}
          <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map(({ title, href, sub, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-[#121212] p-4 text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/45 hover:shadow-[0_16px_40px_rgba(212,175,55,0.12)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 transition group-hover:bg-[#D4AF37]/20">
                  <Icon />
                </span>
                <span>
                  <span className="block font-semibold text-white group-hover:text-[#D4AF37]">{title}</span>
                  <span className="mt-0.5 block text-xs text-[#B3B3B3]">{sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services · Mission · Vision · Contact */}
      <section className="border-t border-white/10 bg-[#121212] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Services</h2>
              <p className="mt-3 text-2xl font-semibold text-white">Everything in one verified marketplace</p>
              <ul className="mt-6 space-y-4 text-[#B3B3B3]">
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D4AF37]" />
                  <span>
                    <strong className="text-white">BNHub</strong> — short-term stays with secure Stripe checkout & host
                    payouts.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D4AF37]" />
                  <span>
                    <strong className="text-white">Residential & luxury</strong> — acquisition and advisory with licensed
                    brokers.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D4AF37]" />
                  <span>
                    <strong className="text-white">Projects & investments</strong> — curated developments and yield-focused
                    inventory.
                  </span>
                </li>
              </ul>
            </div>
            <div className="space-y-10">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Mission</h2>
                <p className="mt-3 text-lg leading-relaxed text-[#B3B3B3]">
                  Build trust at scale: transparent economics, professional standards, and technology that keeps guests,
                  hosts, and investors aligned.
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Vision</h2>
                <p className="mt-3 text-lg leading-relaxed text-[#B3B3B3]">
                  Become the region&apos;s preferred platform where every listing, booking, and deal meets institutional
                  rigor — without losing the human touch.
                </p>
              </div>
              <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#0B0B0B] p-6">
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Contact us</h2>
                <p className="mt-3 text-sm text-[#B3B3B3]">
                  Partnerships, press, or concierge — we respond to serious inquiries quickly.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex rounded-full px-6 py-2.5 text-sm font-bold text-[#0B0B0B]"
                  style={{ backgroundColor: GOLD }}
                >
                  Reach the team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured stays */}
      <HorizontalStrip
        title="Featured stays"
        subtitle="Exceptional homes available for your next trip"
        viewAllHref="/search/bnhub"
      >
        {displayListings.slice(0, 8).map((item: { id: string; title?: string; city?: string; nightPriceCents?: number; photos?: string[] | unknown }) => {
          const photos = Array.isArray(item.photos)
            ? item.photos.filter((p): p is string => typeof p === "string")
            : [];
          const img =
            photos[0] ||
            "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800";
          const price =
            item.nightPriceCents != null ? `$${(item.nightPriceCents / 100).toLocaleString()}` : "$—";
          return (
            <Link
              key={item.id}
              href={featuredListings.length >= 4 ? `/bnhub/${item.id}` : "/search/bnhub"}
              className="card-premium group min-w-[260px] max-w-[280px] shrink-0 snap-start sm:min-w-[280px]"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                <div
                  className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${img}')` }}
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-1 font-semibold text-white group-hover:text-[#D4AF37]">
                  {item.title || "Property"}
                </h3>
                <p className="mt-1 text-sm text-[#B3B3B3]">{item.city || ""}</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {price}
                  <span className="font-normal text-[#B3B3B3]"> / night</span>
                </p>
              </div>
            </Link>
          );
        })}
      </HorizontalStrip>

      {/* Luxury listings */}
      <HorizontalStrip
        title="Luxury listings"
        subtitle="Signature residences and curated premium inventory"
        viewAllHref="/dashboard/luxury"
        viewAllLabel="Luxury hub"
      >
        {LUXURY_PLACEHOLDER.map((l) => (
          <Link
            key={l.id}
            href="/dashboard/luxury"
            className="card-premium group min-w-[260px] max-w-[280px] shrink-0 snap-start overflow-hidden sm:min-w-[280px]"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <div
                className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url('${l.img}')` }}
              />
              <span
                className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black"
                style={{ backgroundColor: GOLD }}
              >
                Luxury
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white group-hover:text-[#D4AF37]">{l.title}</h3>
              <p className="mt-1 text-sm text-[#B3B3B3]">{l.city}</p>
              <p className="mt-2 text-sm font-medium" style={{ color: GOLD }}>
                {l.price}
              </p>
            </div>
          </Link>
        ))}
      </HorizontalStrip>

      {/* Investment opportunities */}
      <HorizontalStrip
        title="Investment opportunities"
        subtitle="Developments and yield-focused projects"
        viewAllHref="/projects"
        viewAllLabel="All projects"
      >
        {(featuredProjects.length > 0
          ? featuredProjects.slice(0, 8)
          : [
              {
                id: "p1",
                name: "Latitude Towers",
                city: "Montreal",
                startingPrice: 450000,
                heroImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
              },
              {
                id: "p2",
                name: "Riverfront Commons",
                city: "Laval",
                startingPrice: 520000,
                heroImage: "https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?w=800",
              },
            ]
        ).map((p: { id: string; name: string; city: string; startingPrice: number; heroImage?: string | null }) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="card-premium group min-w-[260px] max-w-[300px] shrink-0 snap-start overflow-hidden sm:min-w-[300px]"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <div
                className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url('${p.heroImage || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800"}')`,
                }}
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white group-hover:text-[#D4AF37]">{p.name}</h3>
              <p className="mt-1 text-sm text-[#B3B3B3]">{p.city}</p>
              <p className="mt-2 text-sm font-semibold" style={{ color: GOLD }}>
                From $
                {p.startingPrice >= 1000
                  ? `${(p.startingPrice / 1000).toFixed(0)}k`
                  : p.startingPrice.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </HorizontalStrip>

      {/* Verified brokers */}
      <HorizontalStrip
        title="Verified brokers"
        subtitle="Work with licensed professionals across our network"
        viewAllHref="/broker"
        viewAllLabel="Broker desk"
      >
        {BROKER_CARDS.map((b) => (
          <Link
            key={b.name}
            href={b.href}
            className="card-premium min-w-[240px] max-w-[260px] shrink-0 snap-start p-5 sm:min-w-[260px]"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/15 text-[#D4AF37]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <VerifiedBrokerBadge />
            </div>
            <h3 className="mt-4 font-semibold text-white">{b.name}</h3>
            <p className="mt-1 text-sm text-[#B3B3B3]">{b.region}</p>
            <span className="mt-3 inline-flex text-xs font-semibold text-[#D4AF37]">
              Connect →
            </span>
          </Link>
        ))}
      </HorizontalStrip>

      {/* Trust */}
      <section className="border-t border-white/10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Why Mashhour</h2>
          <p className="mx-auto mt-3 max-w-xl text-[#B3B3B3]">
            Verification-first marketplace — transparent economics, secure settlement, professional oversight.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { t: "Vetted listings", d: "Quality & documentation standards" },
              { t: "Secure payments", d: "Stripe-powered checkout & escrow-ready flows" },
              { t: "Licensed experts", d: "Brokers aligned to regional regulations" },
            ].map((x) => (
              <div
                key={x.t}
                className="rounded-2xl border border-white/10 bg-[#121212] p-6 text-center shadow-lg transition hover:border-[#D4AF37]/35"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/15 text-[#D4AF37]">
                  ✓
                </span>
                <p className="mt-3 font-medium text-white">{x.t}</p>
                <p className="mt-1 text-sm text-[#B3B3B3]">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-[#121212] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Open your account</h2>
          <p className="mt-4 text-[#B3B3B3]">
            Save searches, book faster, and access private investment memos.
          </p>
          <Link href="/auth/signup" className="btn-primary mt-8 inline-flex rounded-full px-10 py-3 text-sm">
            Create account →
          </Link>
        </div>
      </section>

      {/* Travel modules */}
      <section className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-sm text-[#B3B3B3]">
            Travel & stays: BNHub · Hotel · Flights · Packages
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {PLATFORM_MODULES.map((mod) => (
              <Link
                key={mod.key}
                href={mod.href}
                className="rounded-xl border border-white/15 bg-[#121212] px-4 py-2 text-sm font-medium text-[#B3B3B3] transition hover:border-[#D4AF37]/40 hover:text-white"
              >
                {mod.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom contact strip */}
      <section className="border-t border-white/10 bg-[#0B0B0B] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Mashhour Investments</h2>
            <p className="mt-2 max-w-md text-sm text-[#B3B3B3]">
              Montreal &amp; Greater Area — premium real estate, BNHub, and advisory.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Email</p>
              <a
                href={getPublicContactMailto()}
                className="mt-2 block text-sm font-medium text-white hover:text-[#D4AF37]"
              >
                {getPublicContactEmail()}
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Phone</p>
              {hasPhone() ? (
                <a
                  href={getPhoneTelLink()}
                  className="mt-2 block text-sm font-medium text-white hover:text-[#D4AF37]"
                >
                  {getPhoneNumber()}
                </a>
              ) : (
                <p className="mt-2 text-sm text-[#B3B3B3]">
                  <Link href="/contact" className="font-medium text-[#D4AF37] hover:text-[#E8C547]">
                    Request a call
                  </Link>{" "}
                  — phone number is configured at deploy time.
                </p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">Social</p>
            {socialEntries.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                {socialEntries.map(([key, label, href]) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B3B3B3] hover:text-[#D4AF37]"
                  >
                    {label}
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#B3B3B3]">
                <Link href="/contact" className="text-[#D4AF37] hover:text-[#E8C547]">
                  Contact us
                </Link>{" "}
                — social profiles are added at deploy time.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
