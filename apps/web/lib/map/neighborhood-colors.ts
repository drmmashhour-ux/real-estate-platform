/** Map / legend colors for investment zone classification (broker UI). */
export function getNeighborhoodZoneColor(zone?: string | null) {
  if (zone === "prime") return "#D4AF37";
  if (zone === "growth") return "#22c55e";
  if (zone === "value_add") return "#3b82f6";
  if (zone === "high_risk") return "#ef4444";
  return "#6b7280";
}
