import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type Stripe from "stripe";

export async function createHostTransfer(input: {
  connectedAccountId: string;
  amountCents: number;
  bookingId: string;
  idempotencyKey?: string;
  stripe?: Stripe | null;
  extraMetadata?: Record<string, string>;
}): Promise<Stripe.Transfer> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }
  const stripe = input.stripe ?? getStripe();
  if (!stripe) throw new Error("Stripe client unavailable");

  return stripe.transfers.create(
    {
      amount: input.amountCents,
      currency: "cad",
      destination: input.connectedAccountId,
      metadata: {
        bookingId: input.bookingId,
        flow: "bnhub_host_payout",
        ...(input.extraMetadata ?? {}),
      },
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined
  );
}
