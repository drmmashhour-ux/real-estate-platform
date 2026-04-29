/** Labels only — safe for client bundles (no Sharp import). */
export function humanizeQualityIssues(issues: readonly string[]): string[] {
  const labels: Record<string, string> = {
    low_resolution: "Low resolution — try a larger photo.",
    blurry: "Looks slightly blurry — steadier framing or more light helps.",
    too_dark: "Image is quite dark — try more lighting.",
    too_bright: "Image looks very bright — reduce glare if possible.",
    extreme_aspect_ratio: "Unusual framing — very wide or tall crops may look cropped.",
  };
  return issues.map((i) => labels[i] ?? i);
}
