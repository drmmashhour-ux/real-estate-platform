import Link from "next/link";
import type { Metadata } from "next";

const GOLD = "#C9A646";

export const metadata: Metadata = {
  title: "Investor relations — LECIPM",
  description: "Company narrative and investor access to platform metrics.",
};

export default function InvestorPitchPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-slate-100">
      <div className="border-b border-white/10 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
            Investor relations
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">LECIPM</h1>
          <p className="mt-4 text-lg text-slate-400">
            A unified real estate operating system for discovery, compliance, collaboration, and financing.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/investor/login"
              className="rounded-xl px-6 py-3 text-sm font-bold text-black"
              style={{ background: GOLD }}
            >
              Investor login
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              Back to site
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h2 className="text-xl font-semibold text-white">Investor Q&A</h2>
        <p className="mt-2 text-sm text-slate-500">
          Search, category filters, and full narrative — built for diligence and live demo.
        </p>
        <div className="mt-8">
          <Link
            href="/investor/qa"
            className="inline-flex rounded-2xl border border-[#C9A646]/35 bg-[#C9A646]/10 px-8 py-4 text-sm font-semibold text-[#C9A646] transition hover:bg-[#C9A646]/15"
          >
            Open Investor Q&A →
          </Link>
        </div>
      </div>
    </div>
  );
}
