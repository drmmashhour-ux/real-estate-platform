export function safeDivide(value: number, by: number) {
  if (!by || by <= 0) return 0;
  return value / by;
}

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function percentChange(current: number, previous: number) {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 1;
  return (current - previous) / previous;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
