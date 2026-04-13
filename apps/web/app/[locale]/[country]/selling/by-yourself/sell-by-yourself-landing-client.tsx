"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  LineChart,
  MessageCircle,
  PenLine,
  Search,
  Sparkles,
} from "lucide-react";
import { PLATFORM_NAME } from "@/config/branding";

const GOLD = "#d4af37";

/** Canonical URL for the Seller Hub listing wizard (auth required). */
const LISTING_HREF = "/dashboard/seller/create";

/**
 * Strategic department name for self-serve / FSBO sellers — aligns with the Prestige line and “direct to buyer” positioning.
 * (Not a separate company; it is the product lane for owner-led sales on LECIPM.)
 */
const PRESTIGE_DIRECT = {
  name: "Prestige Direct",
  tagline: "Owner-led listings on LECIPM — without a traditional listing commission.",
} as const;

function PackageCell({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <td className={`border-b border-black/[0.06] px-4 py-3.5 text-center text-sm ${muted ? "text-[#9a9a9a]" : "text-[#2d2d2d]"}`}>
      {children}
    </td>
  );
}

function formatCad(n: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

const PILLARS = [
  {
    title: "Buy a property",
    body: "Search Québec listings and saved searches when you are ready to move.",
    href: "/explore",
    icon: Search,
  },
  {
    title: "Prestige Direct listing",
    body: "Start the owner-led lane: publish with Essential or Spotlight, then scale with Suite subscriptions if you need more.",
    href: LISTING_HREF,
    icon: Home,
  },
  {
    title: "Documents & compliance",
    body: "Understand platform rules, disclosures, and Québec-relevant selling obligations.",
    href: "/legal/platform-usage",
    icon: FileText,
  },
  {
    title: "Pricing",
    body: "Compare seller plans and what is included before you publish.",
    href: "/pricing/seller",
    icon: LineChart,
  },
  {
    title: "Talk to us",
    body: "Questions about listing, verification, or upgrades — we keep channels short.",
    href: "/support",
    icon: MessageCircle,
  },
] as const;

const CATEGORIES = [
  {
    title: "List & publish",
    desc: "Create your listing, upload media, and submit for review when you are ready to go live.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop",
  },
  {
    title: "Price with confidence",
    desc: "Use benchmarks and comparables on the platform to anchor a realistic asking price.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600&auto=format&fit=crop",
  },
  {
    title: "Show your home",
    desc: "Coordinate visits, inquiries, and follow-ups from your seller workspace.",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=600&auto=format&fit=crop",
  },
  {
    title: "Negotiate & close",
    desc: "Track interest, offers, and paperwork paths — with notary and broker partners when you need them.",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=600&auto=format&fit=crop",
  },
] as const;

const STEPS: Array<{
  n: number;
  title: string;
  body: string;
  allies: readonly string[];
  tools: readonly { label: string; href?: string }[];
}> = [
  {
    n: 1,
    title: "Prepare to sell",
    body: "Repairs, decluttering, photos, and a clear story help buyers commit faster. Gather tax bills, certificates, and any condo docs early.",
    allies: ["Seller dashboard", "Photo checklist", "Support"],
    tools: [
      { label: "Listing wizard" },
      { label: "Document uploads" },
      { label: "Seller guides", href: "/sell/learn" },
    ],
  },
  {
    n: 2,
    title: "Set the right price",
    body: "Combine recent sales, active competition, and your timeline. Adjust if showing feedback or market velocity changes.",
    allies: ["Market browse", "Analyze a deal", "Broker upgrade path"],
    tools: [
      { label: "Deal analyzer", href: "/analyze" },
      { label: "ROI calculator", href: "/tools/roi-calculator" },
      { label: "Browse comparables", href: "/listings" },
    ],
  },
  {
    n: 3,
    title: "Attract buyers",
    body: "Go live with a verified listing, clear specs, and responsive replies. Strong listings reduce friction on the first contact.",
    allies: ["Lead inbox", "Listing analytics", "Featured options"],
    tools: [
      { label: "Create listing", href: LISTING_HREF },
      { label: "Share links" },
      { label: "Buyer inquiries" },
    ],
  },
  {
    n: 4,
    title: "Negotiate & finalize",
    body: "Structure offers, conditions, and timelines with professional support when you want it — notary and brokerage partners integrate with Québec practice.",
    allies: ["Contracts workspace", "Expert brokers", "Notary referrals"],
    tools: [
      { label: "Seller contracts", href: "/dashboard/seller/contracts" },
      { label: "Documents", href: "/dashboard/seller/documents" },
      { label: "Compliance", href: "/legal/platform-usage" },
    ],
  },
];

const GUIDES = [
  {
    title: "Selling hub overview",
    desc: "Compare FSBO, platform broker, and full-service paths in one place.",
    href: "/selling",
  },
  {
    title: "How FSBO works here",
    desc: "Publish fee, buyer contact, and when to add broker support — plain English.",
    href: "/sell/learn",
  },
  {
    title: "Mortgage & buyer tools",
    desc: "Help buyers pre-qualify and strengthen offers linked to your listing.",
    href: "/mortgage",
  },
  {
    title: "Help center",
    desc: "Account, billing, listings, and verification FAQs.",
    href: "/help",
  },
] as const;

export function SellByYourselfLandingClient({
  basicPublishCad,
  premiumPublishCad,
  suiteMonthlyUsd,
}: {
  basicPublishCad: number;
  premiumPublishCad: number;
  /** Standard seller subscription — USD/mo from public catalog (Suite column). */
  suiteMonthlyUsd: number;
}) {
  const [salePrice, setSalePrice] = useState("625000");
  const [commissionPct, setCommissionPct] = useState("5");
  const [guideIndex, setGuideIndex] = useState(0);
  const [packageKind, setPackageKind] = useState<"residential" | "multiplex" | "commercial" | "lot">("residential");

  const commissionNumeric = useMemo(() => {
    const p = parseFloat(salePrice.replace(/,/g, ""));
    const c = parseFloat(commissionPct);
    if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(c) || c < 0) {
      return { traditional: 0, savingsVsBasic: 0 };
    }
    const traditional = (p * c) / 100;
    return {
      traditional,
      savingsVsBasic: Math.max(0, traditional - basicPublishCad),
    };
  }, [salePrice, commissionPct, basicPublishCad]);

  return (
    <div className="bg-[#f7f5f0] text-[#0b0b0b]">
      <div className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <Link href="/selling" className="text-sm font-semibold text-[#5c5c5c] transition hover:text-premium-gold">
            ← All selling options
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-black/10 bg-gradient-to-b from-white to-[#f0ebe3]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-premium-gold">
              {PRESTIGE_DIRECT.name} · FSBO
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Sold on saving — your way, on {PLATFORM_NAME}.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#4a4a4a] sm:text-lg">
              {PRESTIGE_DIRECT.tagline} Keep pricing and showings in your hands, route buyers through a verified seller
              workspace, and add brokerage only when you want it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={LISTING_HREF}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full px-8 text-sm font-bold text-[#0b0b0b] shadow-md transition hover:brightness-105"
                style={{ background: GOLD }}
              >
                Start a listing
              </Link>
              <Link
                href="/pricing/seller"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-[#0b0b0b] bg-transparent px-8 text-sm font-bold text-[#0b0b0b] transition hover:bg-black/[0.04]"
              >
                View pricing
              </Link>
            </div>
            <p className="mt-6 text-xs text-[#777]">
              Publishing from {formatCad(basicPublishCad)} (basic) or {formatCad(premiumPublishCad)} (premium) — illustrative
              vs. typical percentage commissions; your savings depend on your scenario.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#e5e0d8] shadow-lg ring-1 ring-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop"
              alt="Seller meeting with a professional at home"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" aria-hidden />
            <p className="absolute bottom-5 left-5 right-5 text-sm font-semibold text-white drop-shadow-md">
              “We will meet you where you are — DIY first, human support when you need it.”
            </p>
          </div>
        </div>
      </section>

      <div className="border-b border-premium-gold/25 bg-[#e8f2e8]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <p className="text-sm font-semibold text-[#1e3d2e]">
            Developers, landlords &amp; agencies: list projects with scalable visibility — see seller pricing.
          </p>
          <Link
            href="/pricing/seller"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#1e3d2e] hover:underline"
          >
            Business &amp; volume plans <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Packages — DuProprio-style tiers mapped to LECIPM publish fees + seller subscriptions */}
      <section className="border-b border-black/10 bg-white px-4 py-14 sm:px-6 lg:py-18">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Choose your package</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-[#5c5c5c]">
            <strong className="text-[#0b0b0b]">{PRESTIGE_DIRECT.name}</strong> uses a simple ladder:{" "}
            <strong>Essential</strong> and <strong>Spotlight</strong> are <strong>one-time publish fees in CAD</strong> at
            checkout. <strong>Suite</strong> adds <strong>monthly seller tools in USD</strong> — see the full catalog for Pro
            and Premium.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {(
              [
                { id: "residential" as const, label: "Residential" },
                { id: "multiplex" as const, label: "Multiplex" },
                { id: "commercial" as const, label: "Commercial" },
                { id: "lot" as const, label: "Lot / land" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPackageKind(tab.id)}
                className={`min-h-[44px] rounded-full px-5 py-2 text-sm font-bold transition ${
                  packageKind === tab.id ? "bg-[#0b0b0b] text-white" : "bg-black/[0.05] text-[#3d3d3d] hover:bg-black/[0.08]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-[#888]">
            Property-type tabs help you self-identify; final fees and eligibility are confirmed in the listing wizard and at
            checkout.
          </p>

          <div className="mt-10 hidden md:block">
            <div className="overflow-x-auto rounded-2xl border border-black/10 shadow-sm">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 bg-[#faf8f5]">
                    <th className="w-[28%] px-4 py-4 font-semibold text-[#666]">Included</th>
                    <th className="px-4 py-4 text-center font-bold text-[#0b0b0b]">
                      <div className="flex flex-col items-center gap-1">
                        <span>Essential</span>
                        <span className="text-lg text-premium-gold">{formatCad(basicPublishCad)}</span>
                        <span className="text-[10px] font-normal uppercase tracking-wide text-[#888]">one-time CAD</span>
                      </div>
                    </th>
                    <th className="relative bg-[#f3f9f4] px-4 py-4 text-center font-bold text-[#0b0b0b]">
                      <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#0b0b0b] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Most popular
                      </span>
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <span>Spotlight</span>
                        <span className="text-lg text-premium-gold">{formatCad(premiumPublishCad)}</span>
                        <span className="text-[10px] font-normal uppercase tracking-wide text-[#888]">one-time CAD</span>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-center font-bold text-[#0b0b0b]">
                      <div className="flex flex-col items-center gap-1">
                        <span>Suite</span>
                        <span className="text-lg">From ${suiteMonthlyUsd} USD</span>
                        <span className="text-[10px] font-normal uppercase tracking-wide text-[#888]">per month</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th className="border-b border-black/[0.06] px-4 py-3.5 font-medium text-[#0b0b0b]">
                      One-time publish fee (this lane)
                    </th>
                    <PackageCell>{formatCad(basicPublishCad)}</PackageCell>
                    <PackageCell muted={false}>
                      <span className="font-semibold text-premium-gold">{formatCad(premiumPublishCad)}</span>
                    </PackageCell>
                    <PackageCell muted>—</PackageCell>
                  </tr>
                  <tr>
                    <th className="border-b border-black/[0.06] px-4 py-3.5 font-medium text-[#0b0b0b]">
                      Public listing &amp; seller dashboard
                    </th>
                    <PackageCell>
                      <Check className="mx-auto h-5 w-5 text-emerald-600" aria-hidden />
                    </PackageCell>
                    <PackageCell>
                      <Check className="mx-auto h-5 w-5 text-emerald-600" aria-hidden />
                    </PackageCell>
                    <PackageCell>
                      <Check className="mx-auto h-5 w-5 text-emerald-600" aria-hidden />
                    </PackageCell>
                  </tr>
                  <tr>
                    <th className="border-b border-black/[0.06] px-4 py-3.5 font-medium text-[#0b0b0b]">
                      Buyer inquiries &amp; lead inbox
                    </th>
                    <PackageCell>
                      <Check className="mx-auto h-5 w-5 text-emerald-600" aria-hidden />
                    </PackageCell>
                    <PackageCell>
                      <Check className="mx-auto h-5 w-5 text-emerald-600" aria-hidden />
                    </PackageCell>
                    <PackageCell>
                      <Check className="mx-auto h-5 w-5 text-emerald-600" aria-hidden />
                    </PackageCell>
                  </tr>
                  <tr>
                    <th className="border-b border-black/[0.06] px-4 py-3.5 font-medium text-[#0b0b0b]">
                      Verification &amp; compliance flow
                    </th>
                    <PackageCell>
                      <Check className="mx-auto h-5 w-5 text-emerald-600" aria-hidden />
                    </PackageCell>
                    <PackageCell>
                      <Check className="mx-auto h-5 w-5 text-emerald-600" aria-hidden />
                    </PackageCell>
                    <PackageCell>
                      <Check className="mx-auto h-5 w-5 text-emerald-600" aria-hidden />
                    </PackageCell>
                  </tr>
                  <tr>
                    <th className="border-b border-black/[0.06] px-4 py-3.5 font-medium text-[#0b0b0b]">
                      Featured / stronger placement at publish
                    </th>
                    <PackageCell muted>—</PackageCell>
                    <PackageCell>
                      <Check className="mx-auto h-5 w-5 text-emerald-600" aria-hidden />
                    </PackageCell>
                    <PackageCell>Included with higher tiers</PackageCell>
                  </tr>
                  <tr>
                    <th className="border-b border-black/[0.06] px-4 py-3.5 font-medium text-[#0b0b0b]">
                      Ongoing visibility, AI &amp; analytics
                    </th>
                    <PackageCell muted>—</PackageCell>
                    <PackageCell>Limited to publish window</PackageCell>
                    <PackageCell>Standard → Premium seller plans</PackageCell>
                  </tr>
                  <tr>
                    <th className="px-4 py-4 font-medium text-[#0b0b0b]">Get started</th>
                    <PackageCell>
                      <Link
                        href={LISTING_HREF}
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border-2 border-[#0b0b0b] px-4 text-xs font-bold text-[#0b0b0b] hover:bg-black/[0.04]"
                      >
                        Choose Essential
                      </Link>
                    </PackageCell>
                    <PackageCell>
                      <Link
                        href={LISTING_HREF}
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full text-xs font-bold text-[#0b0b0b]"
                        style={{ background: GOLD }}
                      >
                        Choose Spotlight
                      </Link>
                    </PackageCell>
                    <PackageCell>
                      <Link
                        href="/pricing/seller"
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border-2 border-[#0b0b0b] px-4 text-xs font-bold text-[#0b0b0b] hover:bg-black/[0.04]"
                      >
                        Compare Suite
                      </Link>
                    </PackageCell>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 space-y-4 md:hidden">
            {(
              [
                {
                  id: "essential",
                  title: "Essential",
                  price: `${formatCad(basicPublishCad)} one-time`,
                  blurb: "Core publish: listing page, dashboard, inquiries, verification.",
                  href: LISTING_HREF,
                  cta: "Choose Essential",
                  primary: false,
                },
                {
                  id: "spotlight",
                  title: "Spotlight",
                  price: `${formatCad(premiumPublishCad)} one-time`,
                  blurb: "Stronger placement when you go live — best for competitive markets.",
                  href: LISTING_HREF,
                  cta: "Choose Spotlight",
                  primary: true,
                },
                {
                  id: "suite",
                  title: "Suite",
                  price: `From $${suiteMonthlyUsd} USD/mo`,
                  blurb: "Monthly seller subscription for placement, AI, and analytics — stack on top of publish.",
                  href: "/pricing/seller",
                  cta: "Compare Suite",
                  primary: false,
                },
              ] as const
            ).map((col) => (
              <div
                key={col.id}
                className={`rounded-2xl border p-5 ${col.primary ? "border-premium-gold/50 bg-[#f3f9f4] shadow-md" : "border-black/10 bg-white shadow-sm"}`}
              >
                {col.primary ? (
                  <span className="inline-block rounded-full bg-[#0b0b0b] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                ) : null}
                <h3 className={`mt-2 text-lg font-bold ${col.primary ? "" : ""}`}>{col.title}</h3>
                <p className="mt-1 text-premium-gold font-bold">{col.price}</p>
                <p className="mt-2 text-sm text-[#5c5c5c]">{col.blurb}</p>
                <Link
                  href={col.href}
                  className={`mt-4 flex min-h-[48px] w-full items-center justify-center rounded-full text-sm font-bold ${
                    col.primary ? "text-[#0b0b0b]" : "border-2 border-[#0b0b0b] text-[#0b0b0b]"
                  }`}
                  style={col.primary ? { background: GOLD } : undefined}
                >
                  {col.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars — DuProprio sitelink-style */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-18">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Everything in one place</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#5c5c5c] sm:text-base">
          The same building blocks independent sellers expect — search, listing, documents, pricing, and a direct line to
          support — styled for {PLATFORM_NAME} in English.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.title}>
                <Link
                  href={p.href}
                  className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm transition hover:border-premium-gold/40 hover:shadow-md"
                >
                  <Icon className="h-8 w-8 text-premium-gold" aria-hidden />
                  <span className="mt-4 text-lg font-bold">{p.title}</span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-[#5c5c5c]">{p.body}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-premium-gold">
                    Open <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Commission calculator */}
      <section className="border-y border-black/10 bg-[#1a1814] px-4 py-14 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-premium-gold">
              <Calculator className="h-4 w-4" aria-hidden />
              Commission check
            </div>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">See what you could keep</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Compare a traditional percentage commission to our publish fees. This is an illustration only — not legal or
              tax advice.
            </p>
          </div>
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm">
            <label className="block text-xs font-bold uppercase tracking-wide text-white/60" htmlFor="fsbo-sale-price">
              Expected sale price
            </label>
            <input
              id="fsbo-sale-price"
              type="text"
              inputMode="decimal"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-lg font-semibold text-white outline-none focus:border-premium-gold/60"
            />
            <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-white/60" htmlFor="fsbo-commission">
              Assumed total commission (%)
            </label>
            <input
              id="fsbo-commission"
              type="text"
              inputMode="decimal"
              value={commissionPct}
              onChange={(e) => setCommissionPct(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white outline-none focus:border-premium-gold/60"
            />
            <dl className="mt-6 space-y-3 border-t border-white/10 pt-6 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-white/65">Traditional ({commissionPct}%)</dt>
                <dd className="font-bold text-white">{formatCad(commissionNumeric.traditional)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/65">Basic publish fee</dt>
                <dd className="font-semibold text-premium-gold">{formatCad(basicPublishCad)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                <dt className="font-bold text-white">Illustrative savings (vs. basic fee)</dt>
                <dd className="text-lg font-bold text-emerald-400">{formatCad(commissionNumeric.savingsVsBasic)}</dd>
              </div>
            </dl>
            <Link
              href={LISTING_HREF}
              className="mt-6 flex w-full min-h-[48px] items-center justify-center rounded-full text-sm font-bold text-[#0b0b0b]"
              style={{ background: GOLD }}
            >
              Start your listing
            </Link>
          </div>
        </div>
      </section>

      {/* Category grid — Centris “properties for rent” pattern, seller-themed */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-18">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How we support independent sellers</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#5c5c5c]">
          Four focus areas — same narrative buyers see on major Québec portals, adapted for {PLATFORM_NAME}.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <article key={c.title} className="flex flex-col">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-[#e8e4dc] shadow ring-1 ring-black/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt="" className="h-full w-full object-cover" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#0b0b0b]">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5c5c5c]">{c.desc}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            href="/listings"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#0b0b0b] px-10 text-sm font-bold text-white transition hover:bg-[#2a2a2a]"
          >
            See how buyers browse listings
          </Link>
        </div>
      </section>

      {/* Timeline steps */}
      <section className="border-t border-black/10 bg-white px-4 py-14 sm:px-6 lg:py-18">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Your roadmap</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#5c5c5c]">
            A clear sequence — preparation, pricing, visibility, and closing — with platform tools called out at each step.
          </p>
          <div className="relative mt-12 space-y-14 pl-8 sm:pl-12">
            <div
              className="absolute bottom-4 left-[15px] top-4 w-1 rounded-full bg-gradient-to-b from-premium-gold via-premium-gold/60 to-premium-gold/30 sm:left-[19px]"
              aria-hidden
            />
            {STEPS.map((s) => (
              <div key={s.n} className="relative grid gap-8 lg:grid-cols-[1fr_280px]">
                <div>
                  <span
                    className="absolute -left-8 flex h-8 w-8 items-center justify-center rounded-full border-2 border-premium-gold bg-white text-sm font-bold text-[#0b0b0b] shadow sm:-left-10 sm:h-10 sm:w-10"
                    style={{ borderColor: GOLD }}
                  >
                    {s.n}
                  </span>
                  <h3 className="text-xl font-bold sm:text-2xl">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#4a4a4a] sm:text-base">{s.body}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-premium-gold/15 px-3 py-1 text-xs font-semibold text-[#5c4a12]">
                      <Camera className="h-3.5 w-3.5" aria-hidden />
                      Media & disclosure tips in dashboard
                    </span>
                  </div>
                </div>
                <aside className="space-y-4 rounded-2xl border border-black/10 bg-[#f7f5f0] p-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888]">Platform support</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.allies.map((t) => (
                        <span key={t} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#333] shadow-sm">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888]">Tools & links</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.tools.map((t) =>
                        t.href ? (
                          <Link
                            key={t.label}
                            href={t.href}
                            className="rounded-full bg-premium-gold/20 px-3 py-1 text-xs font-semibold text-[#5c4a12] hover:underline"
                          >
                            {t.label}
                          </Link>
                        ) : (
                          <span
                            key={t.label}
                            className="rounded-full bg-premium-gold/20 px-3 py-1 text-xs font-semibold text-[#5c4a12]"
                          >
                            {t.label}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guides carousel-style */}
      <section className="border-t border-black/10 bg-[#eef6f3] px-4 py-14 sm:px-6 lg:py-18">
        <div className="mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 text-premium-gold">
            <BookOpen className="h-6 w-6" aria-hidden />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Guides</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Check out our guides for buying, selling, and financing</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#4a5c56]">
            Curated entry points — start here, then deep-link into dashboards and tools as you progress.
          </p>
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl items-center gap-4">
          <button
            type="button"
            onClick={() => setGuideIndex((i) => (i - 1 + GUIDES.length) % GUIDES.length)}
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#0b0b0b]/20 text-[#0b0b0b] transition hover:border-premium-gold hover:text-premium-gold sm:flex"
            aria-label="Previous guide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((offset) => {
              const g = GUIDES[(guideIndex + offset) % GUIDES.length];
              return (
                <Link
                  key={`${g.title}-${offset}`}
                  href={g.href}
                  className="flex flex-col rounded-2xl border border-black/10 bg-white p-5 text-left shadow-sm transition hover:border-premium-gold/40 hover:shadow-md"
                >
                  <Sparkles className="h-6 w-6 text-premium-gold" aria-hidden />
                  <span className="mt-3 font-bold text-[#0b0b0b]">{g.title}</span>
                  <span className="mt-2 flex-1 text-sm text-[#5c5c5c]">{g.desc}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-premium-gold">
                    Read <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setGuideIndex((i) => (i + 1) % GUIDES.length)}
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#0b0b0b]/20 text-[#0b0b0b] transition hover:border-premium-gold hover:text-premium-gold sm:flex"
            aria-label="Next guide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Curved CTA */}
      <section className="relative bg-white px-4 pb-16 pt-4 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-t-[3rem] bg-gradient-to-b from-[#f5edd8] to-[#ebe4d6] px-6 py-14 text-center shadow-inner sm:px-12 sm:py-16">
          <PenLine className="mx-auto h-10 w-10 text-premium-gold" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Ready to trust yourself?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[#4a4a4a] sm:text-base">
            We are ready to back you with publishing, verification, and optional broker upgrades — all inside {PLATFORM_NAME}.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={LISTING_HREF}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#0b0b0b] px-10 text-sm font-bold text-white transition hover:bg-[#2a2a2a]"
            >
              Create your listing
            </Link>
            <Link
              href="/auth/login?returnUrl=%2Fdashboard%2Ffsbo"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border-2 border-[#0b0b0b] px-10 text-sm font-bold text-[#0b0b0b] transition hover:bg-black/[0.04]"
            >
              Open seller dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
