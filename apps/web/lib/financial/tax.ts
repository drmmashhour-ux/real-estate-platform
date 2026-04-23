export const GST_RATE = 0.05;
export const QST_RATE = 0.09975;

export function calculateTaxesFromBase(baseCents: number) {
  const gstCents = Math.round(baseCents * GST_RATE);
  const qstCents = Math.round(baseCents * QST_RATE);

  return {
    gstCents,
    qstCents,
    totalWithTaxCents: baseCents + gstCents + qstCents,
    taxRateGST: GST_RATE,
    taxRateQST: QST_RATE,
  };
}

export function buildReportingPeriodKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
