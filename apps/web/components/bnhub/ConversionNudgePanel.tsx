"use client";

import { useEffect, useRef } from "react";

import type { ConversionNudge, ConversionScore } from "@/lib/ai/conversionTypes";
import { trackEvent } from "@/src/services/analytics";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  score: ConversionScore;
  nudge: ConversionNudge;
  /** CTA: scroll to booking area */
  ctaTargetId?: string;
  className?: string;
};

/**
 * Non-blocking conversion nudge — does not create false scarcity; copy is governed server-side.
 */
export function ConversionNudgePanel({ listingId, score, nudge, ctaTargetId = "bnhub-book-cta", className }: Props) {
  const shown = useRef(false);
  const display = nudge.displayLevel;

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    void trackEvent("conversion_nudge_shown", {
      listingId,
      intentLevel: score.intentLevel,
      displayLevel: nudge.displayLevel,
    });
  }, [listingId, score.intentLevel, nudge.displayLevel]);

  const onCta = () => {
    void trackEvent("conversion_nudge_clicked", { listingId, intentLevel: score.intentLevel, displayLevel });
    const el = document.getElementById(ctaTargetId);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (display === "low") {
    return (
      <div
        className={cn(
          "rounded-xl border border-white/15 bg-white/[0.04] p-3 text-left text-sm text-white/85",
          className
        )}
        role="region"
        aria-label="Guidance"
      >
        <p className="font-medium text-white">{nudge.title}</p>
        <p className="mt-1 text-white/60">{nudge.message}</p>
        <button
          type="button"
          onClick={onCta}
          className="mt-2 text-left text-sm font-medium text-[#D4AF37] underline decoration-[#D4AF37]/40 hover:decoration-[#D4AF37]"
        >
          Continue to booking
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-left text-sm text-white/90",
        className
      )}
      role="region"
      aria-label="Guidance"
    >
      <p className="font-medium text-amber-100">{nudge.title}</p>
      <p className="mt-1 text-white/70">{nudge.message}</p>
      <button
        type="button"
        onClick={onCta}
        className="mt-2 w-full text-left text-sm font-semibold text-amber-200 underline decoration-amber-200/30 hover:decoration-amber-200"
      >
        Continue to book or reserve
      </button>
    </div>
  );
}
