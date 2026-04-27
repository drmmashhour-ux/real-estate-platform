"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const explorePrimaryClass =
  "ring-2 ring-amber-400/70 shadow-lg shadow-amber-500/25 border border-amber-500/20";
const listPrimaryClass =
  "ring-2 ring-zinc-400/50 shadow-lg shadow-zinc-500/10 border border-zinc-300/30 dark:ring-amber-500/30 dark:shadow-amber-500/10 dark:border-amber-500/20";

type Props = {
  experimentKey: string;
  exploreHref: string;
  listHref: string;
  exploreCtaLabel: string;
  explorePrimary: boolean;
  listPrimary: boolean;
};

/**
 * Fires `hero_view` once per mount; `cta_click` on explore tap (Order 59 — hero_cta_copy).
 */
export function HeroCtaRowWithExperiment({
  experimentKey,
  exploreHref,
  listHref,
  exploreCtaLabel,
  explorePrimary,
  listPrimary,
}: Props) {
  const firedView = useRef(false);

  useEffect(() => {
    if (firedView.current) return;
    firedView.current = true;
    void fetch(`/api/experiments/${encodeURIComponent(experimentKey)}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "hero_view" }),
    });
  }, [experimentKey]);

  const onExploreClick = () => {
    void fetch(`/api/experiments/${encodeURIComponent(experimentKey)}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "cta_click" }),
    });
  };

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-4">
      <Link
        href={exploreHref}
        aria-label="Explore available property listings"
        onClick={onExploreClick}
        className={cn(
          "inline-flex rounded-xl bg-black px-6 py-3 text-white transition hover:bg-black/90",
          explorePrimary && explorePrimaryClass
        )}
      >
        {exploreCtaLabel}
      </Link>

      <Link
        href={listHref}
        aria-label="List your property for sale or rent"
        className={cn(
          "inline-flex rounded-xl border border-zinc-200 bg-background px-6 py-3 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900/50",
          listPrimary && listPrimaryClass
        )}
      >
        List Your Property
      </Link>
    </div>
  );
}
