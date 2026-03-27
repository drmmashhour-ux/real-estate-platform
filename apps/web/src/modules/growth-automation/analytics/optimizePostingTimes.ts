import type { GrowthMarketingPlatform } from "@prisma/client";

type Row = {
  score: number;
  platform: GrowthMarketingPlatform;
  metricDate: Date;
};

/** Heuristic “best hours” by platform from top-quartile rows (UTC). */
export function optimizePostingTimes(scored: Row[]): Record<string, string> {
  const threshold = scored.length ? scored.map((s) => s.score).sort((a, b) => b - a)[Math.floor(scored.length * 0.25)] ?? 0 : 0;
  const good = scored.filter((s) => s.score >= threshold);
  const byPlatform: Partial<Record<GrowthMarketingPlatform, number[]>> = {};
  for (const g of good) {
    const h = g.metricDate.getUTCHours();
    byPlatform[g.platform] = byPlatform[g.platform] ?? [];
    byPlatform[g.platform]!.push(h);
  }
  const out: Record<string, string> = {};
  for (const p of Object.keys(byPlatform) as GrowthMarketingPlatform[]) {
    const hours = byPlatform[p] ?? [];
    const avg = hours.length ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length) : 14;
    out[p] = `Favor UTC ~${avg}:00–${avg + 2}:00 (adjust for Quebec audience)`;
  }
  if (!Object.keys(out).length) {
    return {
      LINKEDIN: "Tue–Thu 13:00–16:00 ET (test window)",
      INSTAGRAM: "12:00–15:00 ET (test window)",
      EMAIL: "Tue/Thu 09:00–11:00 ET (test window)",
    };
  }
  return out;
}
