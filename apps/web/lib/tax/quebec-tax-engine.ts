/**
 * Quebec GST + QST calculation (informational / invoicing).
 * QST is applied on amount including GST (compound).
 * Not legal advice — validate with a CPA for your supply chain.
 */

export type TaxMode = "EXCLUSIVE" | "INCLUSIVE";

export type TaxExemptions = {
  gstExempt?: boolean;
  qstExempt?: boolean;
};

export type TaxLineResult = {
  subtotalCents: number;
  gstCents: number;
  qstCents: number;
  totalCents: number;
  mode: TaxMode;
};

/** Round half-up to integer cents. */
export function roundCents(value: number): number {
  return Math.round(value);
}

/**
 * Exclusive: subtotal is pre-tax. GST = subtotal * gstRate, QST = (subtotal + GST) * qstRate.
 */
export function calculateQuebecTaxExclusiveCents(params: {
  subtotalCents: number;
  gstRate: number;
  qstRate: number;
  exemptions?: TaxExemptions;
}): TaxLineResult {
  const { subtotalCents, gstRate, qstRate, exemptions } = params;
  const gstCents = exemptions?.gstExempt ? 0 : roundCents(subtotalCents * gstRate);
  const qstBase = subtotalCents + gstCents;
  const qstCents = exemptions?.qstExempt ? 0 : roundCents(qstBase * qstRate);
  const totalCents = subtotalCents + gstCents + qstCents;
  return {
    subtotalCents,
    gstCents,
    qstCents,
    totalCents,
    mode: "EXCLUSIVE",
  };
}

/**
 * Inclusive: totalCents includes all tax. Binary-search subtotal so exclusive breakdown matches total.
 */
export function calculateQuebecTaxInclusiveCents(params: {
  totalCents: number;
  gstRate: number;
  qstRate: number;
  exemptions?: TaxExemptions;
}): TaxLineResult {
  const { totalCents, gstRate, qstRate, exemptions } = params;
  if (totalCents <= 0) {
    return { subtotalCents: 0, gstCents: 0, qstCents: 0, totalCents: 0, mode: "INCLUSIVE" };
  }

  const excl = (s: number) =>
    calculateQuebecTaxExclusiveCents({
      subtotalCents: s,
      gstRate,
      qstRate,
      exemptions,
    });

  let lo = 0;
  let hi = totalCents;
  let best = excl(0);
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const r = excl(mid);
    if (r.totalCents <= totalCents) {
      best = r;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  const adjust = totalCents - best.totalCents;
  const subtotalCents = best.subtotalCents + adjust;
  const final = excl(subtotalCents);
  return { ...final, totalCents: totalCents, mode: "INCLUSIVE" };
}

export function calculateTaxForAmount(params: {
  amountCents: number;
  mode: TaxMode;
  gstRate: number;
  qstRate: number;
  exemptions?: TaxExemptions;
}): TaxLineResult {
  if (params.mode === "INCLUSIVE") {
    return calculateQuebecTaxInclusiveCents({
      totalCents: params.amountCents,
      gstRate: params.gstRate,
      qstRate: params.qstRate,
      exemptions: params.exemptions,
    });
  }
  return calculateQuebecTaxExclusiveCents({
    subtotalCents: params.amountCents,
    gstRate: params.gstRate,
    qstRate: params.qstRate,
    exemptions: params.exemptions,
  });
}

// ---------------------------------------------------------------------------
// Standard Québec retail rates — single source for BNHUB + platform invoices
// ---------------------------------------------------------------------------

/** Federal GST in Québec — 5% as decimal (e.g. 0.05). */
export const QUEBEC_GST_RATE = 0.05;

/**
 * Québec QST — 9.975% as decimal.
 * Applied on the amount that includes GST (compound), via `calculateQuebecTaxExclusiveCents`.
 */
export const QUEBEC_QST_RATE = 0.09975;

/** Same rates used for lodging tax (booking) and Stripe invoice line GST/QST. */
export function quebecRetailTaxRates(): { gstRate: number; qstRate: number } {
  return { gstRate: QUEBEC_GST_RATE, qstRate: QUEBEC_QST_RATE };
}

export type QuebecLodgingTaxBreakdown = {
  gstCents: number;
  qstCents: number;
  /** gstCents + qstCents */
  taxCents: number;
  /** Full engine result (subtotal = lodging taxable base before tax). */
  taxLines: TaxLineResult;
};

/**
 * Lodging taxable base = nightly subtotal + cleaning (exclusive).
 * GST on base, then QST on (base + GST). Aligns with Revenu Québec compound QST rules.
 */
export function calculateQuebecRetailTaxOnLodgingBaseExclusiveCents(
  lodgingTaxableBaseCents: number,
  exemptions?: TaxExemptions
): QuebecLodgingTaxBreakdown {
  const taxLines = calculateQuebecTaxExclusiveCents({
    subtotalCents: lodgingTaxableBaseCents,
    gstRate: QUEBEC_GST_RATE,
    qstRate: QUEBEC_QST_RATE,
    exemptions,
  });
  return {
    gstCents: taxLines.gstCents,
    qstCents: taxLines.qstCents,
    taxCents: taxLines.gstCents + taxLines.qstCents,
    taxLines,
  };
}
