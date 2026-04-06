/**
 * SEO intro drafts — editorial + legal review required before publish.
 */
export function draftCityPageIntro(city: string, kind: "fsbo" | "bnhub" | "both"): string {
  const scope =
    kind === "both"
      ? "homes and short stays"
      : kind === "bnhub"
        ? "short-term stays"
        : "homes and resale listings";
  return `Browse ${scope} in ${city} on LECIPM. Listings are shown for discovery — verify details with the host or seller before decisions. We do not guarantee availability or pricing without confirmation.`;
}
