/**
 * Non-blocking Stripe refund / anomaly signals — audit trail only.
 */

import { insertCommissionLegalEventSafe } from "./repositories/commission-legal-event.repository";
import { insertLegalAlertSafe } from "./repositories/legal-alert.repository";
import { logLegalAction } from "./legal-audit.service";
import { legalEngineLog } from "./legal-logging";

export async function observeStripeRefundForCompliance(meta: {
  paymentIntentId: string;
  refundCents: number;
}): Promise<void> {
  try {
    await insertCommissionLegalEventSafe({
      entityType: "STRIPE_PAYMENT_INTENT",
      entityId: meta.paymentIntentId,
      reasonKey: "REFUND_DETECTED",
      severity: "MEDIUM",
      detail: `Stripe refund observed for PI ${meta.paymentIntentId}; amount_refunded_cents=${meta.refundCents}`,
      metadata: { refundCents: meta.refundCents },
    });
    await insertLegalAlertSafe({
      entityType: "STRIPE_PAYMENT_INTENT",
      entityId: meta.paymentIntentId,
      riskLevel: "MEDIUM",
      title: "Refund activity",
      detail: "Stripe refund recorded — monitor for payout timing and dispute patterns.",
      signals: { refundCents: meta.refundCents },
    });
    await logLegalAction({
      entityType: "STRIPE_PAYMENT_INTENT",
      entityId: meta.paymentIntentId,
      action: "REFUND_SIGNAL",
      actorId: null,
      actorType: "SYSTEM",
      metadata: { refundCents: meta.refundCents },
    });
  } catch (e) {
    legalEngineLog("observeStripeRefundForCompliance failed", { error: String(e) });
  }
}
