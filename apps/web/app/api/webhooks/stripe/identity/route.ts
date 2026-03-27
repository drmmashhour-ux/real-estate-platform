/**
 * Stripe Identity webhook — separate signing secret STRIPE_IDENTITY_WEBHOOK_SECRET recommended.
 */

import { headers } from "next/headers";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { applyIdentityWebhookUpdate } from "@/modules/bnhub-trust/services/identityVerificationService";
import { StripeIdentityAdapter } from "@/modules/bnhub-trust/connectors/stripeIdentityAdapter";
import { logTrustAudit } from "@/modules/bnhub-trust/services/trustDecisionAuditService";
import { BnhubTrustIdentityAuditActor } from "@prisma/client";

export const dynamic = "force-dynamic";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  const secret =
    process.env.STRIPE_IDENTITY_WEBHOOK_SECRET?.trim() ?? process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret?.startsWith("whsec_")) {
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }
  const stripe = getStripe();
  if (!stripe) return Response.json({ error: "Stripe not configured" }, { status: 503 });
  const raw = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) return Response.json({ error: "Missing signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const adapter = new StripeIdentityAdapter();
  if (event.type.startsWith("identity.verification_session.")) {
    const obj = event.data.object as Stripe.Identity.VerificationSession;
    const mapped = adapter.mapWebhookPayload(obj);
    if (mapped.sessionId && mapped.status) {
      await applyIdentityWebhookUpdate(mapped.sessionId, {
        status: mapped.status,
        safeSummary: mapped.safeSummary,
      });
    }
    await logTrustAudit({
      actorType: BnhubTrustIdentityAuditActor.WEBHOOK,
      entityType: "stripe_identity",
      entityId: obj.id,
      actionType: event.type,
      actionSummary: "Stripe Identity webhook received",
      after: { status: obj.status },
    });
  }
  return Response.json({ received: true });
}
