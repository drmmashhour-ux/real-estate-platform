"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

function featureCards(isLoggedIn: boolean) {
  return [
    {
      title: "AI insights",
      description: "Scenario modeling in seconds",
      href: "/analyze",
      cta: "Analyze deal",
    },
    {
      title: "Market comparison",
      description: "Scores aligned to local context",
      href: isLoggedIn ? "/compare" : "/demo/compare",
      cta: "Compare strategies",
    },
    {
      title: "Portfolio tracking",
      description: "Saved deals in one place",
      href: isLoggedIn ? "/dashboard" : "/demo/dashboard",
      cta: "View portfolio",
    },
  ] as const;
}

export function HomeHeroFeatureCards({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const cards = useMemo(() => featureCards(isLoggedIn), [isLoggedIn]);

  useEffect(() => {
    cards.forEach((c) => {
      router.prefetch(c.href);
    });
  }, [router, cards]);

  return (
    <div className="mx-auto mt-14 w-full max-w-4xl">
      <div className="grid gap-5 sm:grid-cols-3">
        {cards.map((card) => {
          const aria = `${card.title}. ${card.description}. ${card.cta}.`;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group relative z-30 block cursor-pointer rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-premium-gold/70"
              aria-label={aria}
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212]/90 shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-colors duration-200 group-hover:border-premium-gold/30 group-hover:shadow-[0_12px_40px_rgb(var(--premium-gold-channels) / 0.12)]">
                <div className="relative z-30 cursor-pointer px-5 py-5 text-center transition duration-200 group-hover:scale-105 group-hover:bg-white/5 active:scale-[1.02]">
                  <p className="text-sm font-semibold text-premium-gold">{card.title}</p>
                  <p className="mt-1 text-xs text-[#9CA3AF]">{card.description}</p>
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-premium-gold/80 transition group-hover:text-premium-gold">
                    {card.cta}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
