/**
 * Declarative capability defaults (documentation + static checks).
 * **Authoritative runtime values** merge env with DB via `resolveLaunchFlags()` in `lib/launch/resolve-launch-flags.ts`.
 */
export const FLAGS = {
  ENABLE_FRENCH: true,
  ENABLE_ARABIC: true,
  ENABLE_SYRIA_MARKET: true,
  ENABLE_MANUAL_BOOKINGS: true,
  ENABLE_MANUAL_PAYMENTS: true,
  ENABLE_CONTACT_FIRST_UX: true,
  ENABLE_AI_CONTENT_ENGINE: true,
} as const;

export type FlagKey = keyof typeof FLAGS;
