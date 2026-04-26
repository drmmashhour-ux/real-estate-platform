/**
 * Strict server flag: `DEMO_MODE=1` (investor / pitch APIs without hitting live counts).
 * For broader “demo” behavior (Stripe, UI) see `isDemoMode()` in `lib/demo-mode.ts`.
 */
export const isDemoMode = process.env.DEMO_MODE === "1";
