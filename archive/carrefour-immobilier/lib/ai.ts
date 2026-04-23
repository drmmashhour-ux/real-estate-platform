export function analyzeDeal(price: number, rent: number, expenses: number) {
  const roi = ((rent * 12) - expenses) / price;
  return { roi, verdict: roi > 0.1 ? "GOOD DEAL" : "RISKY" };
}
