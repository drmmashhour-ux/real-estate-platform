export function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

export function safePricePerSqft(priceCents?: number | null, sqft?: number | null) {
  if (!priceCents || !sqft || sqft <= 0) return 0;
  return priceCents / sqft;
}

export function safeYield(avgRentCents?: number | null, avgSalePriceCents?: number | null) {
  if (!avgRentCents || !avgSalePriceCents || avgSalePriceCents <= 0) return 0;
  const annualRent = avgRentCents * 12;
  return annualRent / avgSalePriceCents;
}
