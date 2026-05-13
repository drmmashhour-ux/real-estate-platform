import type { Money } from "../shared/types.js";

export interface FeeBreakdown {
  gross: Money;
  platformFee: Money;
  merchantNet: Money;
}

export function calculatePlatformFee(input: {
  gross: Money;
  platformFeeBps: number;
}): FeeBreakdown {
  if (!Number.isInteger(input.platformFeeBps) || input.platformFeeBps < 0) {
    throw new Error("Platform fee bps must be a non-negative integer.");
  }
  const platformFeeMinor = Math.floor((input.gross.amountMinor * input.platformFeeBps) / 10_000);
  const merchantNetMinor = input.gross.amountMinor - platformFeeMinor;
  if (merchantNetMinor <= 0) throw new Error("Merchant net amount must be positive.");

  return Object.freeze({
    gross: Object.freeze({ ...input.gross }),
    platformFee: Object.freeze({
      amountMinor: platformFeeMinor,
      currency: input.gross.currency,
    }),
    merchantNet: Object.freeze({
      amountMinor: merchantNetMinor,
      currency: input.gross.currency,
    }),
  });
}
