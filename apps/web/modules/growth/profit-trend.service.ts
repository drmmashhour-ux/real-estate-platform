/**
 * Profit trend analysis from persisted `CampaignProfitTrend` rows (7–14d windows).
 */
import type { ProfitTrendLabel } from "./profit-engine.types";
import { getProfitTrend } from "./profit-engine.repository";

export type { ProfitTrendLabel } from "./profit-engine.types";

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stddev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = mean(xs.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

/** Compare first vs second half of window on `ltvToCplRatio` (fallback profitPerLead). */
export async function detectProfitTrendChanges(
  campaignKey: string,
  rangeDays = 14,
): Promise<ProfitTrendLabel> {
  const rows = await getProfitTrend(campaignKey, rangeDays);
  if (rows.length < 3) return "insufficient_data";

  const series = rows
    .map((r) => ({
      t: r.day.getTime(),
      ratio: r.ltvToCplRatio ?? r.profitPerLead ?? null,
    }))
    .filter((x) => x.ratio != null && !Number.isNaN(x.ratio)) as { t: number; ratio: number }[];

  if (series.length < 3) return "insufficient_data";

  series.sort((a, b) => a.t - b.t);
  const mid = Math.floor(series.length / 2);
  const first = series.slice(0, mid);
  const second = series.slice(mid);
  const a = mean(first.map((x) => x.ratio));
  const b = mean(second.map((x) => x.ratio));
  const diff = b - a;
  const threshold = Math.max(0.05, stddev(series.map((x) => x.ratio)) * 0.5);

  if (Math.abs(diff) < threshold) return "insufficient_data";
  return diff > 0 ? "improving" : "declining";
}

export async function detectProfitInstability(campaignKey: string, rangeDays = 14): Promise<boolean> {
  const rows = await getProfitTrend(campaignKey, rangeDays);
  const ratios = rows
    .map((r) => r.ltvToCplRatio ?? r.profitPerLead)
    .filter((x): x is number => x != null && !Number.isNaN(x));
  if (ratios.length < 4) return false;
  const m = mean(ratios);
  if (m <= 0) return stddev(ratios) > 0.35;
  const cv = stddev(ratios) / m;
  return cv > 0.45;
}

/** Combined label for recommendations: instability overrides direction when severe. */
export async function classifyProfitTrendForCampaign(
  campaignKey: string,
  rangeDays = 14,
): Promise<ProfitTrendLabel> {
  const [change, unstable] = await Promise.all([
    detectProfitTrendChanges(campaignKey, rangeDays),
    detectProfitInstability(campaignKey, rangeDays),
  ]);
  if (unstable && change !== "insufficient_data") return "unstable";
  return change;
}
