/**
 * LECIPM First Revenue Engine — broker contract export credits (pay-per-use + packs).
 * Amounts: CAD minor units; Stripe checkout validates server-side.
 */

export const BROKER_EXPORT_CREDIT_PAYMENT_TYPE = "broker_export_credits" as const;

export type BrokerCreditOfferCode = "A" | "B";

export type BrokerCreditOffer = {
  code: BrokerCreditOfferCode;
  labelFr: string;
  priceCents: number;
  /** Credits added to the user's balance after successful payment. */
  credits: number;
};

const OFFER_A: BrokerCreditOffer = {
  code: "A",
  labelFr: "Paiement à l'usage (1 export)",
  priceCents: 1500,
  credits: 1,
};

const OFFER_B: BrokerCreditOffer = {
  code: "B",
  labelFr: "Tôt investisseur — 10 utilisations",
  priceCents: 10_000,
  credits: 10,
};

export const BROKER_CREDIT_OFFERS: Record<BrokerCreditOfferCode, BrokerCreditOffer> = {
  A: OFFER_A,
  B: OFFER_B,
};

export function resolveBrokerCreditOffer(
  offerTypeRaw: string,
  clientAmountCents: number
):
  | { ok: true; value: BrokerCreditOffer }
  | { ok: false; error: string } {
  const k = String(offerTypeRaw || "")
    .trim()
    .toUpperCase();
  if (k !== "A" && k !== "B") {
    return { ok: false, error: "offerType must be A (pay-per-use) or B (10-pack)" };
  }
  const value = BROKER_CREDIT_OFFERS[k];
  if (!Number.isFinite(clientAmountCents) || clientAmountCents !== value.priceCents) {
    return { ok: false, error: "amountCents does not match the selected offer" };
  }
  return { ok: true, value };
}
