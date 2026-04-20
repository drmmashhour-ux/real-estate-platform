export function safeDivide(value: number, by: number) {
  if (!by || by === 0) return 0;
  return value / by;
}

export function round4(value: number) {
  return Math.round(value * 10000) / 10000;
}

export function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function linearProjection(start: number, end: number, forwardFactor: number) {
  const delta = end - start;
  return end + delta * forwardFactor;
}
