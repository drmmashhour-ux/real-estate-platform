/**
 * Single visual model for header utilities (language, phone, login, menu).
 * Same height, padding, radius, type scale — Sign up uses HEADER_CONTROL_CTA only.
 */

export const HEADER_CONTROL =
  "lecipm-touch inline-flex h-10 min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 text-sm font-medium leading-none text-white shadow-none transition hover:border-premium-gold/60 hover:shadow-[0_0_12px_rgb(var(--premium-gold-channels) / 0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold/35";

/** Sign up — same structure, stronger fill (gold). */
export const HEADER_CONTROL_CTA =
  "lecipm-touch inline-flex h-10 min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-premium-gold bg-premium-gold px-4 text-sm font-semibold leading-none text-black shadow-none transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold/50";

/** Native `<select>` — matches control height/padding/border (no inline-flex on select). */
export const HEADER_SELECT =
  "lecipm-touch h-10 min-h-[44px] min-w-[6.25rem] max-w-full cursor-pointer rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 text-sm font-medium text-white shadow-none transition hover:border-premium-gold/60 hover:shadow-[0_0_12px_rgb(var(--premium-gold-channels) / 0.1)] focus:border-premium-gold/70 focus:outline-none focus:ring-2 focus:ring-premium-gold/25";
