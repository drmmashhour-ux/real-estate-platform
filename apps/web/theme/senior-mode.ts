/**
 * Senior Living Hub — accessibility-first design tokens (WCAG-oriented).
 * UI applies these via CSS + Tailwind; “Simple Mode” persists in localStorage.
 */

/** Default on for hub surfaces — paired with user-toggle “Simple Mode”. */
export const LARGE_FONT = true as const;
export const HIGH_CONTRAST = true as const;
export const SIMPLIFIED_LAYOUT = true as const;

/** Minimum body text size (px). */
export const SENIOR_BASE_FONT_PX = 18;
/** Heading scale minimum (px) — use clamp on larger breakpoints. */
export const SENIOR_HEADING_MIN_PX = 24;
export const SENIOR_HEADING_HERO_PX = 32;

/** Touch targets (px). */
export const SENIOR_BUTTON_MIN_HEIGHT_PX = 48;
export const SENIOR_BUTTON_COMFORT_PX = 56;

/** Spacing scale for low-density layouts. */
export const SENIOR_SECTION_PADDING_PX = 20;
export const SENIOR_CARD_PADDING_PX = 24;

/** localStorage key for Simple Mode (bigger text, fewer chrome hints). */
export const SENIOR_SIMPLE_MODE_STORAGE_KEY = "lecipm_senior_simple_mode";

/** Family helper mode — clearer copy + comparison prompts. */
export const SENIOR_FAMILY_MODE_STORAGE_KEY = "lecipm_senior_family_helper_mode";
