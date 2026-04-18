import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getPricingPlans } from "@/modules/business/pricing-model.service";
import { hostEconomicsFlags, marketingLandingFlags } from "@/config/feature-flags";
import { PricingSectionClient } from "@/components/marketing/PricingSectionClient";

const FALLBACK: readonly {
  key: string;
  name: string;
  fee: string;
  bullets: string[];
  popular?: boolean;
}[] = [
  {
    key: "free",
    name: "Free",
    fee: "Low platform fee (configurable)",
    bullets: ["Core listing", "Standard visibility", "Foundational analytics"],
  },
  {
    key: "pro",
    name: "Pro",
    fee: "~7% booking-style fee (env)",
    bullets: ["Pricing insights", "Better analytics", "Optimization tips"],
    popular: true,
  },
  {
    key: "growth",
    name: "Growth",
    fee: "Subscription + reduced fee (env)",
    bullets: ["Advanced insights", "Premium tools roadmap", "Host success alignment"],
  },
];

export function PricingSection() {
  const live = marketingLandingFlags.landingPricingV1 && hostEconomicsFlags.pricingModelV1;
  const plans = live ? getPricingPlans() : null;

  return (
    <PricingSectionClient>
      <section className="border-b border-white/5 bg-landing-dark py-14 sm:py-20">
        <Container>
          <h2 className="text-center font-[family-name:var(--font-serif)] text-3xl font-semibold text-white sm:text-4xl">
            Plans that scale with you
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-landing-text/75">
            Fees and features are configuration-driven — confirm current rates in-product before you commit.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans ?
              plans.map((p) => (
                <Card
                  key={p.planKey}
                  glow={p.planKey === "pro"}
                  className={p.planKey === "pro" ? "border-premium-gold/35 ring-1 ring-premium-gold/20" : "border-white/10"}
                >
                  {p.planKey === "pro" ? (
                    <Badge variant="gold" className="mb-3 w-fit">
                      Most popular
                    </Badge>
                  ) : null}
                  <h3 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-white">{p.displayName}</h3>
                  <p className="mt-2 text-sm text-premium-gold">
                    {(p.bookingFeePercent * 100).toFixed(1)}% booking-style fee
                    {p.monthlySubscriptionCents > 0 ?
                      ` + ${(p.monthlySubscriptionCents / 100).toFixed(0)} / mo`
                    : ""}
                  </p>
                  <ul className="mt-6 space-y-2 text-sm text-landing-text/85">
                    {p.includedFeatures.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-premium-gold">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))
            : FALLBACK.map((p) => (
                <Card
                  key={p.key}
                  glow={!!p.popular}
                  className={p.popular ? "border-premium-gold/35 ring-1 ring-premium-gold/20" : "border-white/10"}
                >
                  {p.popular ? (
                    <Badge variant="gold" className="mb-3 w-fit">
                      Most popular
                    </Badge>
                  ) : null}
                  <h3 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-white">{p.name}</h3>
                  <p className="mt-2 text-sm text-premium-gold">{p.fee}</p>
                  <ul className="mt-6 space-y-2 text-sm text-landing-text/85">
                    {p.bullets.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-premium-gold">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
          </div>
        </Container>
      </section>
    </PricingSectionClient>
  );
}
