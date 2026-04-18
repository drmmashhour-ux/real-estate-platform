/**
 * Simple trend direction from numeric series (internal dashboards).
 */
export function trendDirection(values: number[]): "up" | "down" | "flat" {
  if (values.length < 2) return "flat";
  const mid = Math.floor(values.length / 2);
  const a = values.slice(0, mid).reduce((s, x) => s + x, 0) / mid;
  const b = values.slice(mid).reduce((s, x) => s + x, 0) / (values.length - mid);
  const delta = (b - a) / Math.max(1e-6, a);
  if (delta > 0.05) return "up";
  if (delta < -0.05) return "down";
  return "flat";
}
