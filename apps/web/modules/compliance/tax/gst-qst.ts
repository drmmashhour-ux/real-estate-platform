export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Québec combined GST 5% + QST 9.975% on taxable amount (brokerage services). */
export function calculateQcBrokerTaxes(amount: number) {
  const gst = round2(amount * 0.05);
  const qst = round2(amount * 0.09975);
  return {
    gst,
    qst,
    total: round2(amount + gst + qst),
  };
}
