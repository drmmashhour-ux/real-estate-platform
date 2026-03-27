import Link from "next/link";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";
import { SectionHeading } from "@/components/marketing/SectionHeading";

const tiers = [
  {
    name: "Starter",
    price: "Custom",
    blurb: "Core CRM, messaging, and document rooms for small teams.",
    features: ["Pipeline & contacts", "Deal rooms", "Email notifications"],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "Custom",
    blurb: "Full transaction stack with scheduling, offers, and finance visibility.",
    features: [
      "Everything in Starter",
      "Offers & contracts",
      "Scheduling",
      "Commissions & invoices",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    blurb: "Multi-office governance, analytics, and dedicated rollout support.",
    features: ["SSO & admin controls", "Advanced analytics", "Priority support"],
    highlighted: false,
  },
];

export function MarketingPricingContent() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Pricing"
          title="Plans that scale with your brokerage"
          subtitle="We’ll tailor pricing to team size, markets, and modules — request access to talk with us."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {tiers.map((t, i) => (
            <AnimatedReveal key={t.name} delayMs={i * 80}>
              <div
                className={`flex h-full flex-col rounded-3xl border p-8 ${
                  t.highlighted
                    ? "border-[#C9A646]/50 bg-gradient-to-b from-[#C9A646]/10 to-transparent shadow-xl shadow-[#C9A646]/5"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                {t.highlighted ? (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Most popular</p>
                ) : (
                  <span className="mb-2 block h-4" aria-hidden />
                )}
                <h2 className="font-serif text-2xl font-semibold text-white">{t.name}</h2>
                <p className="mt-2 text-3xl font-bold text-[#C9A646]">{t.price}</p>
                <p className="mt-3 text-sm text-slate-400">{t.blurb}</p>
                <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-300">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A646]" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/#cta"
                  className={`mt-8 inline-flex justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
                    t.highlighted
                      ? "bg-[#C9A646] text-black hover:brightness-110"
                      : "border border-white/20 text-white hover:border-[#C9A646]/50"
                  }`}
                >
                  Request access
                </Link>
              </div>
            </AnimatedReveal>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-slate-500">
          Need investor or mortgage-specific modules? We’ll map them during onboarding.
        </p>
      </div>
    </div>
  );
}
