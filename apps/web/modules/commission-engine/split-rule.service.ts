import type { CommissionCalculationOutput, CommissionRuleConfigV1 } from "./commission-engine.types";

function clampPct(n: number): number {
  if (Number.isNaN(n) || n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

/**
 * Deterministic, explainable split — does not assert legal entitlement.
 * Order: office take from gross → optional deductions → broker share of remainder.
 */
export function applySplitRuleV1(grossCents: number, rule: CommissionRuleConfigV1): CommissionCalculationOutput {
  const warnings: string[] = [];
  const explanation: string[] = [];
  const deductions: CommissionCalculationOutput["deductions"] = [];

  if (grossCents <= 0) {
    warnings.push("Gross commission is zero or negative — review deal inputs.");
  }

  const officePct = clampPct(rule.officeSharePercent);
  const officeShareCents = Math.floor((grossCents * officePct) / 100);
  let remainder = grossCents - officeShareCents;
  explanation.push(
    `Office share: ${officePct}% of gross (${grossCents}¢) → ${officeShareCents}¢. Remainder: ${remainder}¢.`,
  );

  for (const d of rule.deductions ?? []) {
    const base =
      d.basis === "gross"
        ? grossCents
        : d.basis === "remainder_after_office"
          ? remainder
          : remainder;
    const amt = Math.floor((base * d.basisPoints) / 10000);
    const take = Math.min(Math.max(amt, 0), remainder);
    deductions.push({ key: d.key, label: d.label, amountCents: take });
    remainder -= take;
    explanation.push(`Deduction ${d.label} (${d.basis}, ${d.basisPoints / 100}%): ${take}¢.`);
  }

  const brokerPct = clampPct(rule.brokerShareOfRemainderPercent);
  const brokerShareCents = Math.floor((remainder * brokerPct) / 100);
  const residual = remainder - brokerShareCents;
  explanation.push(
    `Broker share: ${brokerPct}% of remainder after deductions (${remainder}¢) → ${brokerShareCents}¢.`,
  );
  if (residual > 0) {
    explanation.push(`Residual ${residual}¢ unallocated by rule — review configuration (team/referral splits).`);
    warnings.push("Residual amount remains after broker share — configure team/referral split or adjust rule.");
  }

  const netBrokerPayoutCents = brokerShareCents;

  return {
    grossCommissionCents: grossCents,
    officeShareCents,
    brokerShareCents,
    deductions,
    netBrokerPayoutCents,
    warnings,
    explanation,
  };
}
