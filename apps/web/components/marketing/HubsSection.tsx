import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Briefcase,
  HelpCircle,
  Home,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { BnHubLogoMark } from "@/components/bnhub/BnHubLogoMark";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { PUBLIC_MAP_SEARCH_URL } from "@/lib/search/public-map-search-urls";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";
import {
  PLATFORM_CARREFOUR_NAME,
  PLATFORM_FINANCIAL_HUB_NAME,
  PLATFORM_IMMOBILIER_HUB_NAME,
} from "@/lib/brand/platform";

export type MarketingHubCard = {
  name: string;
  line: string;
  href?: string;
  Icon: LucideIcon;
  /** Cross-cutting layer — full width, distinct styling */
  layer?: boolean;
};

/** Shared list for marketing landing + hubs section. */
export const MARKETING_HUB_CARDS: MarketingHubCard[] = [
  {
    name: "Buy hub",
    line: "Search listings, filters, and deal context — the main purchase workspace.",
    href: PUBLIC_MAP_SEARCH_URL.listingsBuy,
    Icon: Search,
  },
  {
    name: "Seller hub",
    line: "Listing, verification, and compliance for sellers and FSBO.",
    href: "/sell",
    Icon: Home,
  },
  {
    name: "Short-term stays",
    line: "BNHUB — trips, host tools, and guest dashboard (after sign-in).",
    href: "/bnhub",
    Icon: Building2,
  },
  {
    name: PLATFORM_FINANCIAL_HUB_NAME,
    line: "Mortgage page & calculator, specialist desk, AI pricing, and buyer calculators.",
    href: "/financial-hub",
    Icon: Landmark,
  },
  {
    name: "Finance hub",
    line: "Invoices, commissions, and payments inside your dashboard (sign-in).",
    href: "/dashboard/finance",
    Icon: PiggyBank,
  },
  {
    name: "Broker hub",
    line: "CRM, pipeline, and brokerage workspace for signed-in brokers.",
    href: "/broker/dashboard",
    Icon: Briefcase,
  },
  {
    name: "Help center",
    line: "Guides for booking, selling, brokers, and evaluations.",
    href: "/help",
    Icon: HelpCircle,
  },
  {
    name: "Admin",
    line: "Platform operations and staff console (authorized roles only).",
    href: "/admin",
    Icon: LayoutDashboard,
  },
  {
    name: "AI layer",
    line: "Analyze deals on the web; full AI workspace and copilot live in the dashboard after sign-in.",
    href: "/analyze",
    Icon: Sparkles,
    layer: true,
  },
];

function HubCard({ hub, delayMs }: { hub: MarketingHubCard; delayMs: number }) {
  const { Icon } = hub;
  const isBnHubCard = hub.href === "/bnhub";

  const inner = (
    <>
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-black/40"
          style={{
            borderColor: "rgb(var(--premium-gold-channels) / 0.35)",
            boxShadow: "0 0 24px rgb(var(--premium-gold-channels) / 0.12)",
          }}
          aria-hidden
        >
          {isBnHubCard ? (
            <BnHubLogoMark size="xs" className="!h-7 max-w-[72px] sm:!h-8 sm:max-w-[80px]" />
          ) : (
            <Icon className="h-6 w-6 text-premium-gold" strokeWidth={1.75} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-white">
            {isBnHubCard ? <span className="sr-only">BNHUB · </span> : null}
            {hub.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            <span
              className="mr-1.5 font-medium text-premium-gold/80"
              aria-hidden
            >
              →
            </span>
            {hub.line}
          </p>
          {hub.href ? (
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-premium-gold/80">
              Open hub →
            </p>
          ) : null}
        </div>
      </div>
    </>
  );

  const baseCard =
    "rounded-2xl p-6 transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-premium-bg";
  const ringGold = "focus-visible:ring-premium-gold/70";

  const className = hub.layer
    ? `${baseCard} ${ringGold} border bg-gradient-to-br from-premium-gold/12 via-premium-gold/6 to-transparent shadow-[0_0_48px_rgb(var(--premium-gold-channels)/0.1)] hover:border-premium-gold/55`
    : `${baseCard} ${ringGold} border border-white/10 bg-premium-card hover:border-premium-gold/45 shadow-[0_0_32px_rgb(var(--premium-gold-channels)/0.06)] hover:shadow-[0_0_40px_rgb(var(--premium-gold-channels)/0.14)]`;

  const layerStyle = hub.layer
    ? { borderColor: "rgb(var(--premium-gold-channels) / 0.4)" }
    : { borderColor: "rgba(255,255,255,0.1)" };

  if (hub.href) {
    return (
      <AnimatedReveal delayMs={delayMs}>
        <Link href={hub.href} className={`block h-full ${className}`} style={layerStyle}>
          {inner}
        </Link>
      </AnimatedReveal>
    );
  }

  return (
    <AnimatedReveal delayMs={delayMs}>
      <div className={className} style={layerStyle}>
        {inner}
      </div>
    </AnimatedReveal>
  );
}

export function HubsSection() {
  const productHubs = MARKETING_HUB_CARDS.filter((h) => !h.layer);
  const aiLayer = MARKETING_HUB_CARDS.find((h) => h.layer)!;

  return (
    <section id="hubs" className="scroll-mt-24 bg-brand-background px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Ecosystem hubs"
          title={
            <span className="flex flex-col items-center gap-5 sm:gap-6">
              <BnHubLogoMark size="md" className="max-h-14 sm:max-h-16" />
              <span className="block">Two product hubs — {PLATFORM_IMMOBILIER_HUB_NAME}</span>
            </span>
          }
          subtitle={`BNHUB covers short stays, trips, and travel AI. ${PLATFORM_IMMOBILIER_HUB_NAME} (${PLATFORM_CARREFOUR_NAME}) covers long-term rent and every sales path — with a broker, platform broker, or on your own (FSBO).`}
        />
        <div className="mb-10 grid gap-4 lg:grid-cols-2">
          <AnimatedReveal delayMs={0}>
            <Link
              href="/bnhub"
              className="block h-full rounded-2xl border border-premium-gold/35 bg-gradient-to-br from-premium-gold/14 via-premium-gold/6 to-transparent p-6 shadow-[0_0_48px_rgb(var(--premium-gold-channels)/0.12)] transition hover:border-premium-gold/55"
              style={{ borderColor: "rgb(var(--premium-gold-channels) / 0.45)" }}
            >
              <BnHubLogoMark size="sm" className="max-w-[200px]" />
              <h3 className="mt-3 text-xl font-semibold text-white">Short-term stays hub</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Guest dashboard, host / hotel / motel mode on one host dashboard, trips, and Travel AI — all in BNHUB.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-premium-gold/75">Open BNHUB →</p>
            </Link>
          </AnimatedReveal>
          <AnimatedReveal delayMs={80}>
            <Link
              href="/dashboard/real-estate"
              className="block h-full rounded-2xl border border-white/12 bg-premium-card p-6 shadow-[0_0_32px_rgb(var(--premium-gold-channels)/0.08)] transition hover:border-premium-gold/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold/90">{PLATFORM_IMMOBILIER_HUB_NAME}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Rent &amp; sales</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Long-term rent, buyer workspace, broker-guided sale, independent broker tools, and FSBO — sign in for your workspace.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-premium-gold/75">Open Immobilier Hub →</p>
            </Link>
          </AnimatedReveal>
        </div>
        <p className="mb-6 text-center text-sm text-slate-500">More entry points by role — browse below.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productHubs.map((hub, i) => (
            <HubCard key={hub.name} hub={hub} delayMs={i * 50} />
          ))}
        </div>
        <div className="mt-4">
          <HubCard hub={aiLayer} delayMs={productHubs.length * 50} />
        </div>
      </div>
    </section>
  );
}
