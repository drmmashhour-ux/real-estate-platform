/**
 * Future payment provider boundary (Stripe, etc.). Do not call live APIs until configured.
 */

export type CheckoutSessionInput = {
  tenantId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
};

export async function createCheckoutSession(_input: CheckoutSessionInput): Promise<{ url: string | null }> {
  return { url: null };
}

export async function verifyPaymentWebhook(_payload: unknown, _signature: string | null): Promise<{
  ok: boolean;
}> {
  return { ok: false };
}

export async function createInvoicePaymentLink(_invoiceId: string): Promise<{ url: string | null }> {
  return { url: null };
}
