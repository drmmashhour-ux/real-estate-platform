/**
 * Canonical enterprise path: POST /api/webhooks/stripe  
 * Implementation lives in `app/api/stripe/webhook/route.ts` (Stripe Hosted Checkout + Connect).
 */
export { POST } from "../../stripe/webhook/route";

export const dynamic = "force-dynamic";
