export function safeDivide(value: number, by: number) {
  if (!by || by === 0) return 0;
  return value / by;
}

export function percentChange(current: number, previous: number) {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 1;
  return (current - previous) / previous;
}

export function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
