/** Pure formatters for investment opportunity UI — safe for client import. */

export function formatExpectedRoiBand(expectedRoi: number): string {
  const pct = expectedRoi <= 1 ? expectedRoi * 100 : expectedRoi;
  const low = Math.max(0, pct * 0.85);
  const high = pct * 1.15;
  return `${low.toFixed(1)}%–${high.toFixed(1)}% (est.)`;
}

export function summarizeRationale(rationaleJson: unknown): string {
  if (rationaleJson == null) return "";
  if (typeof rationaleJson === "string") return rationaleJson.slice(0, 280);
  if (typeof rationaleJson === "object" && rationaleJson !== null && "summary" in rationaleJson) {
    const s = (rationaleJson as { summary?: unknown }).summary;
    if (typeof s === "string") return s.slice(0, 280);
  }
  try {
    const raw = JSON.stringify(rationaleJson);
    return raw.length > 280 ? `${raw.slice(0, 277)}…` : raw;
  } catch {
    return "";
  }
}
