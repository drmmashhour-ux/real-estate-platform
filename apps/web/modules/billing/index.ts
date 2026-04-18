/**
 * Billing entrypoints — Stripe is implemented under `app/api/stripe/*` and `modules/billing/*` (workspace).
 * Re-export stable helpers for documentation consumers.
 */
export { createWorkspaceCheckoutSession } from "@/modules/billing/createWorkspaceCheckoutSession";
