import Link from "next/link";
import type { Metadata } from "next";
import { InvestorQA } from "@/components/investor/InvestorQA";

const GOLD = "var(--color-premium-gold)";

export const metadata: Metadata = {
  title: "Investor Q&A",
  description:
    "Key investor questions and answers — strategy, market, execution, and differentiation for LECIPM.",
};

export default function InvestorQAPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-slate-100">
      <div className="border-b border-white/10 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/investor"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300"
            >
              ← Investor relations
            </Link>
            <span className="text-slate-700">·</span>
            <Link
              href="/investor/login"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300"
            >
              Investor login
            </Link>
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            Diligence
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Investor Q&A</h1>
          <p className="mt-3 text-base text-slate-400">
            Concise answers for live demo and follow-up — search, filter by topic, expand what you need.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <InvestorQA />
      </div>
    </div>
  );
}
