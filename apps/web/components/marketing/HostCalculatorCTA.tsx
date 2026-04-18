"use client";

import Link from "next/link";

export function HostCalculatorCTA() {
  return (
    <section className="px-4 py-16 text-center sm:px-6">
      <h2 className="font-serif text-2xl text-white">Compare your current platform vs LECIPM</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">
        Estimate your net revenue difference with transparent assumptions — no guaranteed outcomes.
      </p>
      <Link
        href="/host/roi-calculator"
        className="mt-6 inline-flex rounded-full bg-premium-gold px-8 py-3 text-sm font-semibold text-black hover:bg-[#E8D589]"
      >
        Open ROI calculator
      </Link>
    </section>
  );
}
