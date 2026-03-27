/**
 * Single visual model for header utilities (language, phone, login, menu).
 * Same height, padding, radius, type scale — Sign up uses HEADER_CONTROL_CTA only.
 */

export const HEADER_CONTROL =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 text-sm font-medium leading-none text-white shadow-none transition hover:border-[#C9A646]/60 hover:shadow-[0_0_12px_rgba(201,166,70,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A646]/35";

/** Sign up — same structure, stronger fill (gold). */
export const HEADER_CONTROL_CTA =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#C9A646] bg-[#C9A646] px-4 text-sm font-semibold leading-none text-black shadow-none transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A646]/50";

/** Native `<select>` — matches control height/padding/border (no inline-flex on select). */
export const HEADER_SELECT =
  "h-10 min-w-[6.25rem] max-w-full cursor-pointer rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 text-sm font-medium text-white shadow-none transition hover:border-[#C9A646]/60 hover:shadow-[0_0_12px_rgba(201,166,70,0.1)] focus:border-[#C9A646]/70 focus:outline-none focus:ring-2 focus:ring-[#C9A646]/25";
