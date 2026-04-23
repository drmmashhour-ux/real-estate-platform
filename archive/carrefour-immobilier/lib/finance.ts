export function welcomeTax(price: number) {
  if (price < 500000) return price * 0.005;
  if (price < 1000000) return price * 0.01;
  return price * 0.015;
}
