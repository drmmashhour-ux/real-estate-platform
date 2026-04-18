/**
 * Landing headline clarity checks — heuristic text only.
 */
export function suggestLandingHeadlineClarity(current: string, city: string) {
  const c = city.trim() || "your market";
  if (current.length < 12) {
    return { improved: `Find homes and stays in ${c} with clear next steps on LECIPM.`, reason: "Headline too short for SEO clarity." };
  }
  return { improved: current.trim(), reason: "Headline length OK — A/B test subheads next." };
}
