/**
 * Investor demo safety — presentation routes must not trigger production side effects.
 *
 * - No Stripe charges (booking demo uses a disabled CTA; no PaymentIntent).
 * - No lead billing / unlock APIs from these pages (forms are illustrative).
 * - No demo-scoped server actions that INSERT into billing tables.
 *
 * Future demo mutations must check isDemoMutationAllowed() from demoGuard (off by default).
 */

export const DEMO_SAFETY_COPY =
  "Demo mode: simulated UI only — no payment capture, no outbound billing, no irreversible writes from these screens.";
