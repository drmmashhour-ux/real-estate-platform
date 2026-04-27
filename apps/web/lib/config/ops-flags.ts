/**
 * Operational toggles (additive; default preserves current behavior when unset).
 * @see ENABLE_AI_PRICING, ENABLE_FRAUD_BLOCK in `.env.example`
 */

/** BNHub / dynamic price branch in `runAutonomousAgent`. Off when `ENABLE_AI_PRICING=0|false|off`. */
export function isAiPricingEnabled(): boolean {
  const v = process.env.ENABLE_AI_PRICING?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off") return false;
  return true;
}

/**
 * When false, fraud path still logs + `RiskEvent`, but skips `executeActions` (no auto block/review apply).
 * Off when `ENABLE_FRAUD_BLOCK=0|false|off`.
 */
export function isFraudAutoExecuteEnabled(): boolean {
  const v = process.env.ENABLE_FRAUD_BLOCK?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off") return false;
  return true;
}
