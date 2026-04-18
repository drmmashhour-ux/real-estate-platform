/**
 * Broker value framing — educational, not revenue guarantees.
 */
export function buildBrokerValuePreview(city: string) {
  const c = city.trim() || "your market";
  return {
    headline: `Run ${c} deals with clearer pipelines`,
    points: [
      "Unified CRM leads with explainable scoring — fewer missed follow-ups.",
      "BNHub + residential tools stay side-by-side without breaking broker workflows.",
    ],
    cta: "Book a workspace walkthrough with your admin",
  };
}
