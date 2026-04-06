import type { Metadata } from "next";
import Link from "next/link";
import { TrackedMarketingLink } from "@/components/marketing/TrackedMarketingLink";

export const metadata: Metadata = {
  title: "Join as a broker",
  description:
    "Join LECIPM as a broker to get stronger listing presentation, lead workflow, client dossier exports, and premium visibility.",
};

const brokerBenefits = [
  "Premium listing presentation that helps buyers trust what they are seeing",
  "Lead inbox and CRM workflow to keep opportunities organized",
  "Printable client dossiers and listing exports for serious presentations",
  "AI-assisted content and follow-up support for faster marketing execution",
  "Visibility and growth tools built for active Quebec real estate brokers",
  "A platform positioned around trust, structure, and operational clarity",
];

const plans = [
  {
    name: "Broker Starter",
    price: "$79-$149/mo",
    blurb: "For individual brokers who want clean visibility and a better workflow foundation.",
    features: ["Broker profile", "Listing placement", "Lead inbox", "Basic CRM", "Print/export tools"],
  },
  {
    name: "Broker Pro",
    price: "$199-$349/mo",
    blurb: "Best core plan for brokers who want stronger lead flow, content support, and client management.",
    features: [
      "Everything in Starter",
      "AI listing content",
      "AI follow-up help",
      "Client dossier export",
      "Compliance-aware workflow tools",
    ],
    highlight: true,
  },
  {
    name: "Broker Elite",
    price: "$499-$990/mo",
    blurb: "Premium visibility and growth support for serious brokers and broker teams.",
    features: [
      "Everything in Pro",
      "Priority lead routing",
      "Advanced reporting",
      "Premium profile placement",
      "Marketing support",
    ],
  },
] as const;

export default function JoinBrokerPage() {
  return (
    <div className="bg-[#0B0B0B] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,#3b2a08,transparent_36%),linear-gradient(180deg,#0b0b0b,#111827)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-premium-gold">Broker Growth</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Built for brokers who want more than listing space.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              Join a platform that helps you present listings more professionally, manage leads with more clarity,
              and move clients forward with stronger workflow support.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <TrackedMarketingLink
                href="/broker/apply"
                label="join_broker_hero_primary"
                meta={{ page: "join-broker", placement: "hero", audience: "broker" }}
                className="rounded-full bg-premium-gold px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Join as a broker
              </TrackedMarketingLink>
              <TrackedMarketingLink
                href="/pricing/broker"
                label="join_broker_hero_secondary"
                meta={{ page: "join-broker", placement: "hero", audience: "broker" }}
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
              >
                See broker pricing
              </TrackedMarketingLink>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {brokerBenefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
                >
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-premium-gold/20 bg-black/30 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-premium-gold/90">Why brokers join</p>
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-medium text-white">Professional presentation</p>
                <p className="mt-2 text-sm text-slate-400">
                  Make listings look stronger with premium pages, cleaner structure, and export-ready materials.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-medium text-white">Lead and client workflow</p>
                <p className="mt-2 text-sm text-slate-400">
                  Keep inquiries, clients, and next steps visible instead of losing momentum across disconnected tools.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-medium text-white">Growth-ready platform identity</p>
                <p className="mt-2 text-sm text-slate-400">
                  Use a brand that supports trust, broker growth, seller acquisition, and premium market positioning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold">Plans</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Simple broker packages built for growth</h2>
            <p className="mt-4 text-base text-slate-400">
              Keep the decision simple: start with visibility and workflow, then move into stronger lead and brand support.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl border p-6 ${
                  ("highlight" in plan && plan.highlight)
                    ? "border-premium-gold/40 bg-premium-gold/10 shadow-[0_0_32px_rgb(var(--premium-gold-channels)/0.16)]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <p className="text-lg font-semibold text-white">{plan.name}</p>
                <p className="mt-3 text-3xl font-semibold text-premium-gold">{plan.price}</p>
                <p className="mt-3 text-sm text-slate-400">{plan.blurb}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-premium-gold">+</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <TrackedMarketingLink
                  href={plan.name === "Broker Starter" ? "/broker/apply" : "/pricing/broker"}
                  label={`join_broker_plan_${plan.name.toLowerCase().replace(/\s+/g, "_")}`}
                  meta={{ page: "join-broker", placement: "plans", plan: plan.name }}
                  className="mt-8 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
                >
                  {plan.name === "Broker Starter" ? "Start as broker" : "View plan details"}
                </TrackedMarketingLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold">Call to action</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Give your listings and workflow a stronger platform.</h2>
            <p className="mt-3 text-slate-400">
              Join with better visibility, cleaner operations, and the tools to turn more listing attention into serious opportunity.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <TrackedMarketingLink
              href="/broker/apply"
              label="join_broker_footer_primary"
              meta={{ page: "join-broker", placement: "footer", audience: "broker" }}
              className="rounded-full bg-premium-gold px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Apply now
            </TrackedMarketingLink>
            <TrackedMarketingLink
              href="/contact"
              label="join_broker_footer_secondary"
              meta={{ page: "join-broker", placement: "footer", audience: "broker" }}
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
            >
              Talk to our team
            </TrackedMarketingLink>
          </div>
        </div>
      </section>
    </div>
  );
}
