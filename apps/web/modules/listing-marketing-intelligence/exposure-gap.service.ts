export function detectExposureGaps(input: { views: number; saves: number; daysOnMarket: number }): string[] {
  const out: string[] = [];
  if (input.views > 30 && input.saves < 2) {
    out.push("Listing receives views but few saves — consider strengthening hero image and headline.");
  }
  if (input.daysOnMarket > 21 && input.views < 10) {
    out.push("Limited views after several weeks — review search visibility, price positioning, and media.");
  }
  return out;
}
