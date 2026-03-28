import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Home,
  Landmark,
  LayoutDashboard,
  Search,
  Sparkles,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

type Hub = {
  name: string;
  line: string;
  href?: string;
  Icon: LucideIcon;
  /** Cross-cutting layer — full width, distinct styling */
  layer?: boolean;
};

const hubs: Hub[] = [
  {
    name: "Listings",
    line: "Browse verified properties, compare deals, and move with confidence.",
    href: "/listings",
    Icon: Search,
  },
  {
    name: "SellerHub",
    line: "Listing, verification, and compliance for sellers and FSBO.",
    href: "/sell",
    Icon: Home,
  },
  {
    name: "BNHub",
    line: "Short-term stays, hospitality, and BNHub host tools.",
    href: "/bnhub/stays",
    Icon: Building2,
  },
  {
    name: "MortgageHub",
    line: "Financing paths and specialist matching.",
    href: "/mortgage",
    Icon: Landmark,
  },
  {
    name: "BrokerHub",
    line: "CRM, pipeline, and brokerage workspace (signed-in brokers).",
    href: "/broker/dashboard",
    Icon: Briefcase,
  },
  {
    name: "Admin",
    line: "Platform operations and controls (authenticated admins only).",
    href: "/admin",
    Icon: LayoutDashboard,
  },
  {
    name: "AI Layer",
    line: "Trust, scoring, and copilot intelligence across every hub.",
    Icon: Sparkles,
    layer: true,
  },
];

function HubCard({ hub, delayMs }: { hub: Hub; delayMs: number }) {
  const { Icon } = hub;

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
          <Icon className="h-6 w-6 text-premium-gold" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-white">{hub.name}</h3>
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
  const productHubs = hubs.filter((h) => !h.layer);
  const aiLayer = hubs.find((h) => h.layer)!;

  return (
    <section id="hubs" className="scroll-mt-24 bg-brand-background px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Ecosystem hubs"
          title="Six hubs, one AI layer"
          subtitle="Listings, sell, BNHub stays, mortgage, brokers, and admin — unified trust, intelligence, and workflows."
        />
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
