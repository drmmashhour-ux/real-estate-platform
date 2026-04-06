import { prisma } from "@/lib/db";
import { logError, logWarn } from "@/lib/logger";
import { calculateFees } from "@/lib/payments/utils/fees";
import { stripeCreateOrchestratedCheckout } from "@/lib/payments/providers/stripe";
import { cloverCreateCheckoutSession } from "@/lib/payments/providers/clover";
import type { CreatePaymentSessionInput, CreatePaymentSessionResult, PaymentProvider } from "@/lib/payments/types";
import { assertSafeMetadata } from "@/lib/payments/security";
import { emitPaymentFailed } from "@/lib/payments/launch-events";
import { logPaymentAuditEvent } from "@/lib/payments/payment-audit";

function pickPrimaryProvider(paymentType: CreatePaymentSessionInput["paymentType"]): PaymentProvider {
  if (paymentType === "office_payment") return "clover";
  return "stripe";
}

async function persistOrchestratedRow(args: {
  provider: PaymentProvider;
  providerPaymentId: string | null;
  input: CreatePaymentSessionInput;
  platformFeeCents: number;
  hostAmountCents: number;
  status: string;
  checkoutUrl: string | null;
}): Promise<string> {
  const row = await prisma.orchestratedPayment.create({
    data: {
      provider: args.provider,
      providerPaymentId: args.providerPaymentId,
      userId: args.input.userId,
      bookingId: args.input.bookingId ?? undefined,
      paymentType: args.input.paymentType,
      amountCents: args.input.amountCents,
      currency: args.input.currency ?? "cad",
      platformFeeCents: args.platformFeeCents,
      hostAmountCents: args.hostAmountCents,
      status: args.status,
      checkoutSessionUrl: args.checkoutUrl,
      metadata: assertSafeMetadata(args.input.metadata) as object,
    },
  });
  void logPaymentAuditEvent({
    paymentId: row.id,
    provider: args.provider,
    status: args.status,
    userId: args.input.userId,
    bookingId: args.input.bookingId ?? null,
    source: "orchestration_checkout_created",
  }).catch(() => {});
  return row.id;
}

/**
 * Creates a hosted checkout session via Stripe (primary) or Clover (secondary),
 * persists `OrchestratedPayment`, and applies fallback rules on Stripe failure.
 */
export async function createPaymentSession(input: CreatePaymentSessionInput): Promise<CreatePaymentSessionResult> {
  const fees = calculateFees(input.amountCents);
  const primary = pickPrimaryProvider(input.paymentType);

  const tryStripe = async (): Promise<
    { url: string; providerPaymentId: string | null } | { error: string }
  > => {
    return stripeCreateOrchestratedCheckout(input, fees);
  };

  const tryClover = async (): Promise<
    { url: string; providerPaymentId: string | null } | { error: string }
  > => {
    return cloverCreateCheckoutSession(input, fees);
  };

  if (primary === "clover") {
    const clover = await tryClover();
    if ("error" in clover) {
      return { ok: false, error: clover.error };
    }
    const id = await persistOrchestratedRow({
      provider: "clover",
      providerPaymentId: clover.providerPaymentId,
      input,
      platformFeeCents: fees.platformFeeCents,
      hostAmountCents: fees.hostAmountCents,
      status: "pending",
      checkoutUrl: clover.url,
    });
    return { ok: true, provider: "clover", url: clover.url, orchestratedPaymentId: id, providerPaymentId: clover.providerPaymentId };
  }

  const first = await tryStripe();
  if (!("error" in first)) {
    const id = await persistOrchestratedRow({
      provider: "stripe",
      providerPaymentId: first.providerPaymentId,
      input,
      platformFeeCents: fees.platformFeeCents,
      hostAmountCents: fees.hostAmountCents,
      status: "pending",
      checkoutUrl: first.url,
    });
    return {
      ok: true,
      provider: "stripe",
      url: first.url,
      orchestratedPaymentId: id,
      providerPaymentId: first.providerPaymentId,
    };
  }

  logWarn(`[orchestrator] Stripe failed (${first.error}) paymentType=${input.paymentType}`);

  if (input.paymentType === "booking") {
    await emitPaymentFailed({
      reason: "stripe_unavailable_booking_escalation",
      userId: input.userId,
      bookingId: input.bookingId ?? null,
      error: first.error,
    });
    try {
      const id = await persistOrchestratedRow({
        provider: "stripe",
        providerPaymentId: null,
        input,
        platformFeeCents: fees.platformFeeCents,
        hostAmountCents: fees.hostAmountCents,
        status: "failed",
        checkoutUrl: null,
      });
      return {
        ok: false,
        error:
          "Stripe checkout unavailable for this booking. Team has been notified — please retry shortly or contact support.",
        orchestratedPaymentId: id,
      };
    } catch (e) {
      logError("orchestrator persist failed row", e);
      return { ok: false, error: first.error };
    }
  }

  const fb = await tryClover();
  if ("error" in fb) {
    return { ok: false, error: `Stripe: ${first.error}; Clover: ${fb.error}` };
  }
  const id = await persistOrchestratedRow({
    provider: "clover",
    providerPaymentId: fb.providerPaymentId,
    input,
    platformFeeCents: fees.platformFeeCents,
    hostAmountCents: fees.hostAmountCents,
    status: "pending",
    checkoutUrl: fb.url,
  });
  return {
    ok: true,
    provider: "clover",
    url: fb.url,
    orchestratedPaymentId: id,
    providerPaymentId: fb.providerPaymentId,
  };
}
