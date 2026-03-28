import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buildPlanCheckoutHref, type BillingPeriod } from "@/lib/pricing/public-catalog";

const PERIOD: BillingPeriod = "monthly";

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: "Free",
    blurb: "Basic listings",
    features: ["Basic listings", "Limited photos", "No verification"],
    highlight: false,
    badge: null as string | null,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$99/mo",
    blurb: "Best for active brokers",
    features: ["Trust verification", "Seller readiness", "Listing boost", "Basic analytics"],
    highlight: true,
    badge: "Best for active brokers",
  },
  {
    id: "elite" as const,
    name: "Platinum",
    price: "$299/mo",
    blurb: "Maximize conversions",
    features: ["Priority leads", "Premium placement", "Advanced analytics", "Compliance tools"],
    highlight: false,
    badge: "Maximize conversions",
  },
];

export function BrokerPricingConversion() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">Simple pricing. Powerful results.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#A1A1A1]">
          Start free — upgrade when you are ready for verification, placement, and analytics.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((p) => (
          <Card
            key={p.id}
            hoverable
            glow={p.highlight}
            className={`relative flex flex-col p-6 ${p.highlight ? "ring-1 ring-premium-gold/40" : ""}`}
          >
            {p.badge ? (
              <Badge variant="gold" className="mb-3 w-fit">
                {p.badge}
              </Badge>
            ) : null}
            <h2 className="text-lg font-semibold text-white">{p.name}</h2>
            <p className="mt-2 font-serif text-3xl font-bold text-premium-gold">{p.price}</p>
            <p className="mt-1 text-xs text-[#A1A1A1]">{p.blurb}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm text-[#A1A1A1]">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-premium-gold" aria-hidden>
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={p.id === "free" ? "/auth/signup" : buildPlanCheckoutHref("broker", p.id, PERIOD)}
              className={`mt-8 block rounded-full py-3 text-center text-sm font-bold transition duration-200 ${
                p.highlight
                  ? "bg-premium-gold text-[#0B0B0B] shadow-[0_0_24px_rgb(var(--premium-gold-channels) / 0.35)] hover:bg-premium-gold"
                  : "border border-white/15 text-white hover:border-premium-gold/40"
              }`}
            >
              {p.id === "free" ? "Start free" : "Choose plan"}
            </Link>
          </Card>
        ))}
      </div>

      <Card glow className="p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-2">
              Enterprise
            </Badge>
            <h2 className="text-xl font-semibold text-white">Custom pricing</h2>
            <ul className="mt-4 space-y-2 text-sm text-[#A1A1A1]">
              <li>Workspaces &amp; team governance</li>
              <li>SLA + compliance workflows</li>
              <li>API access &amp; audit exports</li>
            </ul>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-premium-gold/50 bg-premium-gold/10 px-8 py-3 text-sm font-semibold text-premium-gold transition hover:bg-premium-gold/20"
          >
            Talk to sales
          </Link>
        </div>
      </Card>

      <p className="text-center text-sm text-[#A1A1A1]">
        Start free → upgrade when you need trust verification and premium placement.
      </p>
    </div>
  );
}
