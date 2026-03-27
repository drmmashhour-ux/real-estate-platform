/**
 * Transaction (sale) fee calculation – platform facilitation fee.
 */

const TRANSACTION_FEE_PERCENT = 0.5; // 0.5% of transaction value; configurable per market later
const MIN_FEE_CENTS = 99;
const MAX_FEE_CENTS = 99900; // $999

export interface TransactionFeeInput {
  transactionValueCents: number;
  feePercent?: number;
}

export interface TransactionFeeOutput {
  transactionValueCents: number;
  platformFeeCents: number;
  feePercent: number;
}

export function calculateTransactionFee(input: TransactionFeeInput): TransactionFeeOutput {
  const pct = input.feePercent ?? TRANSACTION_FEE_PERCENT;
  let feeCents = Math.round((input.transactionValueCents * pct) / 100);
  feeCents = Math.max(MIN_FEE_CENTS, Math.min(MAX_FEE_CENTS, feeCents));
  return {
    transactionValueCents: input.transactionValueCents,
    platformFeeCents: feeCents,
    feePercent: pct,
  };
}

export { TRANSACTION_FEE_PERCENT, MIN_FEE_CENTS, MAX_FEE_CENTS };
