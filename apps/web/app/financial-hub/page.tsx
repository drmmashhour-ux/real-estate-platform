import type { Metadata } from "next";
import Link from "next/link";
import { ToolShell, LegalDisclaimerBlock } from "@/components/tools/ToolShell";
import { MarketPricingAssistant } from "@/components/finance/MarketPricingAssistant";
import { LeadCTA } from "@/components/ui/LeadCTA";
import { StandaloneMortgageCalculator } from "@/components/finance/StandaloneMortgageCalculator";

export const metadata: Metadata = {
  title: "Financial services hub",
  description:
    "One buyer-facing hub for mortgage planning, appraisal estimates, ROI calculations, and professional contact paths on LECIPM.",
};

const tools = [
  {
    href: "/mortgage",
    title: "Mortgage expert contact",
    desc: "Speak with a verified mortgage specialist for approval guidance, timelines, and financing questions.",
  },
  {
    href: "/appraisal-calculator",
    title: "Appraisal calculator",
    desc: "Use the public valuation tool to estimate property value before making an offer or preparing a sale.",
  },
  {
    href: "/tools/roi-calculator",
    title: "ROI calculator",
    desc: "Model cap rate, gross yield, and cash-on-cash scenarios for investment-minded buyers.",
  },
  {
    href: "/evaluate",
    title: "Seller valuation flow",
    desc: "Open the existing evaluation flow directly when you want the standard lead-capture experience.",
  },
] as const;

const serviceSteps = [
  "Start with numbers: mortgage payment, valuation estimate, and ROI scenario.",
  "Move into advice: open mortgage expert help or speak with a licensed broker.",
  "Continue to property action: use listing pages for ImmoContact when you are ready to contact on a specific property.",
] as const;

export default function FinancialHubPage() {
  return (
    <ToolShell
      title="Financial services hub"
      subtitle="Mortgage planning, appraisal estimates, ROI math, and professional contact paths in one buyer-facing workspace."
    >
      <section className="rounded-3xl border border-premium-gold/20 bg-[radial-gradient(circle_at_top,#2d2208,transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold">Professional buyer support</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Everything a serious buyer needs before asking for expert service.</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
          This hub brings together the financial tools and contact paths buyers use most: mortgage planning, appraisal
          estimates, ROI analysis, and direct access to professionals when they want more support.
        </p>
        <div className="mt-6">
          <LeadCTA variant="consultation" compactTrust />
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-premium-gold/40 hover:bg-white/[0.05]"
          >
            <h2 className="text-xl font-semibold text-premium-gold">{tool.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{tool.desc}</p>
            <p className="mt-5 text-sm font-medium text-white">Open tool →</p>
          </Link>
        ))}
      </section>

      <div className="mt-8">
        <StandaloneMortgageCalculator />
      </div>

      <div className="mt-8">
        <MarketPricingAssistant />
      </div>

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
            When the buyer wants more than self-service, this hub should move them into the right human support quickly.
          </p>
          <div className="mt-5 space-y-4 text-sm">
            <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
              <p className="font-medium text-white">Mortgage expert service</p>
              <p className="mt-2 text-slate-400">
                For pre-approval, financing structure, monthly payment questions, and approval readiness.
              </p>
              <Link href="/mortgage#request-contact" className="mt-3 inline-block text-premium-gold hover:underline">
                Request mortgage contact
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
              <p className="font-medium text-white">Licensed broker support</p>
              <p className="mt-2 text-slate-400">
                For strategy, negotiation, buyer readiness, and property-specific next steps.
              </p>
              <Link href="/sell#sell-consultation" className="mt-3 inline-block text-premium-gold hover:underline">
                Talk to a broker
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
              <p className="font-medium text-white">ImmoContact on listings</p>
              <p className="mt-2 text-slate-400">
                For property-specific contact, listing collaboration, and traceable buyer-to-listing communication.
              </p>
              <Link href="/listings" className="mt-3 inline-block text-premium-gold hover:underline">
                Open listings for ImmoContact
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
              <p className="font-medium text-white">Professional network hub</p>
              <p className="mt-2 text-slate-400">
                For discovering brokers, mortgage experts, and future local transaction partners in one trusted network layer.
              </p>
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
