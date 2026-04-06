"use client";

import { isPublicTestMode } from "@/lib/config/app-mode";

/**
 * Visible when `NEXT_PUBLIC_APP_MODE=test` — reminds operators that Stripe and data are for validation only.
 */
export function TestModeBanner() {
  if (!isPublicTestMode()) return null;

  return (
    <div
      className="sticky top-0 z-[70] border-b border-[#D4AF37]/40 bg-[#0a0a0a]/98 px-3 py-1.5 text-center text-[11px] text-[#E8D589] shadow-[0_2px_16px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:text-xs"
      role="status"
      aria-live="polite"
    >
      <span className="font-semibold tracking-wide text-[#D4AF37]">TEST MODE</span>
      <span className="mx-2 text-white/35" aria-hidden>
        —
      </span>
      <span className="text-white/75">Payments use Stripe test mode or simulation — not live charges.</span>
    </div>
  );
}
