"use client";

import Link from "next/link";

export function HostValueHero() {
  return (
    <section className="border-b border-premium-gold/20 bg-gradient-to-b from-black via-zinc-950 to-black px-4 py-16 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-premium-gold">Hosts</p>
      <h1 className="mt-4 font-serif text-3xl text-white sm:text-4xl md:text-5xl">
        Make more money from your property with AI
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-slate-400">
        LECIPM is built to improve host net income — transparent fees, pricing intelligence, and optional boosts. Not a
        promise of earnings; a clearer model you can stress-test.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/host/roi-calculator"
          className="rounded-full bg-premium-gold px-6 py-3 text-sm font-semibold text-black hover:bg-[#E8D589]"
        >
          Estimate my revenue
        </Link>
        <Link
          href="/signup"
          className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-premium-gold/50"
        >
          Get free revenue analysis
        </Link>
      </div>
    </section>
  );
}
