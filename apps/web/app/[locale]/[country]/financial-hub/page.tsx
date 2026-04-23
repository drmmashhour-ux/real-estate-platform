import type { Metadata } from "next";
import Link from "next/link";
import { ToolShell, LegalDisclaimerBlock } from "@/components/tools/ToolShell";
import { MarketPricingAssistant } from "@/components/finance/MarketPricingAssistant";
import { LeadCTA } from "@/components/ui/LeadCTA";
import { StandaloneMortgageCalculator } from "@/components/finance/StandaloneMortgageCalculator";
import { PLATFORM_FINANCIAL_HUB_NAME } from "@/lib/brand/platform";

export const metadata: Metadata = {
  title: PLATFORM_FINANCIAL_HUB_NAME,
  description:
    "Mortgage calculator, AI market pricing, appraisal and ROI tools, and paths to mortgage experts and the specialist desk — one hub on LECIPM.",
};

const pillarLinks = [
  {
    id: "mortgage",
    href: "/mortgage",
    title: "Mortgage & calculator",
    desc: "Full mortgage page with lead form, specialist matching, and embedded AI help — plus payment math below.",
  },
  {
    id: "broker-desk",
    href: "/dashboard/expert",
    title: "Mortgage specialist desk",
    desc: "Signed-in mortgage experts: leads, inbox, AI tools, marketplace, and billing (redirects if you are not a partner).",
  },
  {
    id: "mortgage-unlock",
    href: "/dashboard/mortgage",
    title: "Mortgage hub (dashboard)",
    desc: "Platform entry for the mortgage workflow: unlock the specialist program and see hub analytics.",
  },
  {
    id: "help-calculators",
    href: "/appraisal-calculator",
    title: "Customer help calculators",
    desc: "Appraisal estimate, ROI scenarios, and seller valuation — step-by-step numbers before you talk to anyone.",
  },
] as const;

const brokerValuationEngines = [
  {
    href: "/dashboard/broker/appraisal",
    title: "Appraisal Hub",
    desc: "Broker workspace for valuation support, pricing analysis, and appraisal report drafts — with review gates.",
  },
  {
    href: "/dashboard/broker/appraisal/comparative",
    title: "Comparative sales",
    desc: "Sales comparison path and map-linked comparables (sign in as broker).",
  },
  {
    href: "/dashboard/broker/appraisal/income",
    title: "Income approach",
    desc: "Income-based pricing analysis worksheets (broker dashboard).",
  },
  {
    href: "/dashboard/broker/appraisal/cost",
    title: "Cost approach",
    desc: "Replacement / cost context for the appraisal report draft (broker dashboard).",
  },
  {
    href: "/dashboard/broker/appraisal/land",
    title: "Land / lot",
    desc: "Unimproved land and lot logic for market estimates (broker dashboard).",
  },
] as const;

const customerTools = [
  {
    href: "/appraisal-calculator",
    title: "Appraisal calculator",
    desc: "Estimate value before an offer or listing.",
  },
  {
    href: "/tools/roi-calculator",
    title: "ROI calculator",
    desc: "Cap rate, yield, and cash-on-cash for investors.",
  },
  {
    href: "/evaluate",
    title: "Seller valuation flow",
    desc: "Standard evaluation path with lead capture.",
  },
] as const;

const serviceSteps = [
  "Start with numbers: mortgage payment (below), AI pricing, appraisal, or ROI.",
  "Go deeper: open the mortgage page for experts, or sign in to the specialist desk if you are a partner.",
  "Act on property: use listings and ImmoContact when you are ready for a specific home.",
] as const;

const anchorClass =
  "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-premium-gold/40 hover:text-white";

export default function FinancialHubPage() {
  return (
    <ToolShell
      title={PLATFORM_FINANCIAL_HUB_NAME}
      subtitle="Mortgage planning, the specialist desk, AI-assisted pricing, and self-serve calculators — one entry for buyers and partners."
    >
      <section className="rounded-3xl border border-premium-gold/20 bg-[radial-gradient(circle_at_top,#2d2208,transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold">Mortgage · AI · calculators</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          {PLATFORM_FINANCIAL_HUB_NAME}: everything before you sign or call a broker.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
          Use the mortgage calculator and AI pricing on this page, jump to the public mortgage hub for expert contact, or
          open the mortgage specialist desk when you are a verified partner.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="On this page">
          <a href="#pillars" className={anchorClass}>
            Four pillars
          </a>
          <a href="#mortgage-calculator" className={anchorClass}>
            Mortgage calculator
          </a>
          <a href="#ai-pricing" className={anchorClass}>
            AI calculator
          </a>
          <a href="#customer-tools" className={anchorClass}>
            Help calculators
          </a>
        </nav>
        <div className="mt-6">
          <LeadCTA variant="consultation" compactTrust />
        </div>
      </section>

      <section id="pillars" className="mt-8 scroll-mt-24">
        <h2 className="text-lg font-semibold text-white">What lives in this hub</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Four connected areas: public mortgage + math, the partner desk, dashboard onboarding, and buyer-facing calculators.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {pillarLinks.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-premium-gold/40 hover:bg-white/[0.05]"
            >
              <h3 className="text-xl font-semibold text-premium-gold">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{p.desc}</p>
              <p className="mt-5 text-sm font-medium text-white">Open →</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="broker-valuation" className="mt-8 scroll-mt-24">
        <h2 className="text-lg font-semibold text-white">Broker valuation support</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          LECIPM brokers: open the appraisal engine for pricing analysis and appraisal report drafts. This is valuation
          support — not an automatic certified appraisal unless separately reviewed and signed under the proper professional
          process.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brokerValuationEngines.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-premium-gold/40 hover:bg-white/[0.05]"
            >
              <h3 className="text-xl font-semibold text-premium-gold">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{p.desc}</p>
              <p className="mt-5 text-sm font-medium text-white">Open →</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="mortgage-calculator" className="mt-8 scroll-mt-24">
        <h2 className="mb-4 text-lg font-semibold text-white">Mortgage calculator</h2>
        <StandaloneMortgageCalculator />
        <p className="mt-4 text-sm text-slate-400">
          Need a human?{" "}
          <Link href="/mortgage" className="font-medium text-premium-gold hover:underline">
            Open the full mortgage page
          </Link>{" "}
          for specialists and the contact form.
        </p>
      </section>

      <section id="ai-pricing" className="mt-8 scroll-mt-24">
        <h2 className="mb-4 text-lg font-semibold text-white">AI calculator (market pricing assistant)</h2>
        <p className="mb-4 max-w-3xl text-sm text-slate-400">
          Ask in natural language about comps, ranges, and listing context. Not a substitute for a licensed appraisal or
          lender approval.
        </p>
        <MarketPricingAssistant />
      </section>

      <section id="customer-tools" className="mt-8 scroll-mt-24">
        <h2 className="text-lg font-semibold text-white">Financial customer help — calculators</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Self-serve estimates and education before you commit to a property or a financing path.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {customerTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-premium-gold/40 hover:bg-white/[0.05]"
            >
              <h3 className="text-lg font-semibold text-premium-gold">{tool.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{tool.desc}</p>
              <p className="mt-5 text-sm font-medium text-white">Open tool →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr,0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white">How this hub works</h2>
          <div className="mt-5 space-y-3">
            {serviceSteps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-800 bg-black/20 p-4 text-sm text-slate-300">
                Step {index + 1}: {step}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white">Professional contact paths</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            When self-serve is not enough, move quickly to the right human support.
          </p>
          <div className="mt-5 space-y-4 text-sm">
            <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
              <p className="font-medium text-white">Mortgage expert service</p>
              <p className="mt-2 text-slate-400">
                Pre-approval, financing structure, payments, and approval readiness.
              </p>
              <Link href="/mortgage#request-contact" className="mt-3 inline-block text-premium-gold hover:underline">
                Request mortgage contact
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
              <p className="font-medium text-white">Licensed broker support</p>
              <p className="mt-2 text-slate-400">Strategy, negotiation, and property-specific next steps.</p>
              <Link href="/sell#sell-consultation" className="mt-3 inline-block text-premium-gold hover:underline">
                Talk to a broker
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
              <p className="font-medium text-white">ImmoContact on listings</p>
              <p className="mt-2 text-slate-400">Property-specific, traceable buyer-to-listing communication.</p>
              <Link href="/listings" className="mt-3 inline-block text-premium-gold hover:underline">
                Browse listings
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
              <p className="font-medium text-white">Professional network</p>
              <p className="mt-2 text-slate-400">Brokers, mortgage experts, and local partners in one layer.</p>
              <Link href="/professionals" className="mt-3 inline-block text-premium-gold hover:underline">
                Open professional hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LegalDisclaimerBlock />
    </ToolShell>
  );
}
