/** Rolling mean for host response latency (ms). */
export function nextRollingAverageMs(
  previousAvg: number | null,
  previousCount: number,
  newSampleMs: number
): { avg: number; count: number } {
  const count = previousCount + 1;
  const avg =
    previousAvg == null
      ? Math.round(newSampleMs)
      : Math.round((previousAvg * previousCount + newSampleMs) / count);
  return { avg, count };
}
