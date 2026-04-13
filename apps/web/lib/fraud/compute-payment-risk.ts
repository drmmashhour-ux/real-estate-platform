import type Stripe from "stripe";
import { POINTS } from "@/lib/fraud/rules";
import { recordFraudSignal } from "@/lib/fraud/record-signal";

function radarOutcome(pi: Stripe.PaymentIntent): { riskLevel?: string; riskScore?: number } | null {
  const ch = pi.charges?.data?.[0] as { outcome?: { risk_level?: string; risk_score?: number } } | undefined;
  return ch?.outcome ?? null;
}

/**
 * Stripe `payment_intent.payment_failed` (and similar) — Radar outcome when present.
 */
export async function evaluatePaymentFraudFromStripePaymentIntent(pi: Stripe.PaymentIntent): Promise<void> {
  const md = pi.metadata ?? {};
  const userId = typeof md.userId === "string" ? md.userId : null;
  let points = POINTS.payment_failed;
  const ro = radarOutcome(pi);
  if (ro?.risk_level === "elevated" || ro?.risk_level === "highest") {
    points += POINTS.stripe_radar_elevated;
  }
  if (pi.last_payment_error) {
    points += 8;
  }

  await recordFraudSignal({
    entityType: "payment",
    entityId: pi.id,
    signalType: "stripe_payment_intent_failed",
    riskPoints: Math.min(80, points),
    metadataJson: {
      radar: ro,
      errorCode: pi.last_payment_error?.code ?? null,
    },
  });

  if (userId) {
    await recordFraudSignal({
      entityType: "user",
      entityId: userId,
      signalType: "user_linked_payment_failure",
      riskPoints: 10,
      metadataJson: { paymentIntentId: pi.id },
    });
  }
}
