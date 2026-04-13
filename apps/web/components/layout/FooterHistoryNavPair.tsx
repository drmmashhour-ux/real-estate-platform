"use client";

import { useRouter } from "next/navigation";

const segmentedWrap =
  "flex items-center gap-0.5 rounded-full border border-premium-gold/35 bg-black/50 p-0.5 shadow-[0_0_20px_rgb(var(--premium-gold-channels)/0.12)]";
const segmentedBtn =
  "min-h-[44px] min-w-[44px] rounded-full px-3 text-xs font-semibold text-premium-gold transition hover:bg-premium-gold/15 hover:text-premium-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-premium-gold/60 sm:text-sm";

const footerRowBtn =
  "inline-flex min-h-[48px] min-w-[120px] flex-1 items-center justify-center rounded-xl border border-premium-gold/45 bg-premium-gold/6 px-4 text-sm font-semibold text-premium-gold transition hover:border-premium-gold/70 hover:bg-premium-gold/14 hover:text-premium-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-premium-gold/60 sm:min-w-[140px] sm:flex-none";

/** Slim row above the investment tab bar (same z-index — not covered by GlobalFooterDock). */
const investmentStripBtn =
  "min-h-[40px] flex-1 rounded-lg border border-premium-gold/40 bg-premium-gold/6 px-2 text-xs font-semibold text-premium-gold transition hover:border-premium-gold/65 hover:bg-premium-gold/12 hover:text-premium-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-premium-gold/60 active:opacity-90";

type Variant = "segmented" | "footerRow" | "investmentStrip";

export function FooterHistoryNavPair({
  variant = "segmented",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const router = useRouter();

  if (variant === "footerRow") {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-3 sm:justify-start ${className}`}>
        <button
          type="button"
          onClick={() => router.back()}
          className={footerRowBtn}
          aria-label="Back to previous page"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => router.forward()}
          className={footerRowBtn}
          aria-label="Continue forward in history"
        >
          Continue
        </button>
      </div>
    );
  }

  if (variant === "investmentStrip") {
    return (
      <div
        className={`flex max-w-2xl items-stretch justify-center gap-2 px-2 pt-1.5 ${className}`}
        role="navigation"
        aria-label="Page history"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className={investmentStripBtn}
          aria-label="Back to previous page"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => router.forward()}
          className={investmentStripBtn}
          aria-label="Continue forward in history"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className={`${segmentedWrap} ${className}`} role="navigation" aria-label="Page history">
      <button
        type="button"
        onClick={() => router.back()}
        className={segmentedBtn}
        aria-label="Back to previous page"
      >
        Back
      </button>
      <button
        type="button"
        onClick={() => router.forward()}
        className={segmentedBtn}
        aria-label="Continue forward in history"
      >
        Continue
      </button>
    </div>
  );
}
