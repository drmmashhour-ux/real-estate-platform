import type { Metadata } from "next";
import Link from "next/link";
import { EvaluateClient } from "@/app/evaluate/evaluate-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Appraisal calculator",
  description:
    "Use the LECIPM appraisal calculator to estimate property value in Montreal, Laval, and Quebec. Free lead-generation valuation with broker follow-up available.",
  openGraph: {
    title: "Appraisal calculator",
    description: "Estimate property value with the LECIPM appraisal calculator. Free, fast, and built for seller conversion.",
  },
};

const highlights = [
  "Instant estimate range based on local city pricing bands and living area",
  "Built to help sellers understand likely value before listing decisions",
  "Can be used as a lead magnet for broker and seller acquisition campaigns",
  "Broker follow-up remains available when a user wants guidance after the estimate",
];

export default function AppraisalCalculatorPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,#2f2308,transparent_30%),linear-gradient(180deg,#0b0b0b,#111827)]">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-premium-gold">Seller valuation</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Free appraisal calculator for faster seller decisions</h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg text-slate-300">
            Give sellers an immediate value estimate, then move them into stronger listing support, broker guidance, and
            next-step conversion inside the platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="#appraisal-form"
              className="rounded-full bg-premium-gold px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Use the calculator
            </Link>
            <Link
              href="/start-listing"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
            >
              Explore seller launch page
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 md:grid-cols-2">
            {highlights.map((highlight) => (
              <div key={highlight} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
                {highlight}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-100/90">
            <p className="font-semibold text-amber-200">Important note</p>
            <p className="mt-2">
              This calculator provides an indicative estimate only. It is designed for seller guidance and lead generation, not
              as a formal legal appraisal or certified valuation report.
            </p>
          </div>
        </div>
      </section>

      <div id="appraisal-form">
        <EvaluateClient />
      </div>
    </main>
  );
}
