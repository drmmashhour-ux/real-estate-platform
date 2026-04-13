"use client";

import { ActionButton } from "@/components/ui/ActionButton";

const GOLD = "#C9A96E";

type LuxuryHeroProps = {
  title: string;
  subtitle: string;
  accent?: string;
};

export function LuxuryHero({ title, subtitle, accent = GOLD }: LuxuryHeroProps) {
  return (
    <section className="relative min-h-[340px] w-[calc(100%+2rem)] max-w-none -mx-4 overflow-hidden rounded-2xl sm:-mx-6 sm:w-[calc(100%+3rem)]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600')",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(105deg, rgba(0,0,0,0.82) 0%, rgba(15,15,15,0.6) 50%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      <div className="relative flex min-h-[340px] flex-col justify-end px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: accent }}>
          Featured
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-2 text-lg text-slate-300 sm:text-xl">
          {subtitle}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ActionButton href="/design-templates" accent={accent} variant="primary">
            Generate Premium Design
          </ActionButton>
          <ActionButton href="/dashboard/listings" accent={accent} variant="secondary">
            Optimize for Luxury Buyers
          </ActionButton>
        </div>
      </div>
    </section>
  );
}
