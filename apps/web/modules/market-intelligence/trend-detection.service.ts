import { trendDirection } from "@/modules/kpi/kpi.trends.service";

export { trendDirection };

export function movingAverage(values: number[], window: number): number[] {
  if (values.length === 0 || window < 1) return [];
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return out;
}
