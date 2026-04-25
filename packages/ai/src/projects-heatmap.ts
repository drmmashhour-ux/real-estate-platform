/**
 * AI demand heatmap – heuristic demand score by zone (Montreal/Laval).
 * Used for map overlay and prioritization.
 */

export type ProjectForHeatmap = {
  id: string;
  name?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  status?: string;
  address?: string;
  featured?: boolean | null;
};

export type DemandResult = {
  demandScore: number;
  demandLabel: "low" | "medium" | "high";
  weight: number;
};

const MONTREAL_DOWNTOWN = { lat: 45.5017, lng: -73.5673 };
const LAVAL_CENTER = { lat: 45.6066, lng: -73.7243 };

function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function analyzeDemandZone(project: ProjectForHeatmap): DemandResult {
  const city = (project.city ?? "").toLowerCase();
  const lat = project.latitude ?? (city === "laval" ? LAVAL_CENTER.lat : MONTREAL_DOWNTOWN.lat);
  const lng = project.longitude ?? (city === "laval" ? LAVAL_CENTER.lng : MONTREAL_DOWNTOWN.lng);

  let score = 40;
  if (city === "montreal") {
    const d = distanceKm(lat, lng, MONTREAL_DOWNTOWN.lat, MONTREAL_DOWNTOWN.lng);
    if (d < 2) score += 35;
    else if (d < 5) score += 20;
    else if (d < 10) score += 10;
  } else if (city === "laval") {
    const d = distanceKm(lat, lng, LAVAL_CENTER.lat, LAVAL_CENTER.lng);
    if (d < 1.5) score += 30;
    else if (d < 4) score += 15;
  }
  if (project.status === "under-construction") score += 10;
  if (project.featured) score += 15;
  score = Math.min(100, score);

  const demandLabel: "low" | "medium" | "high" =
    score >= 70 ? "high" : score >= 50 ? "medium" : "low";
  const weight = score / 100;

  return { demandScore: score, demandLabel, weight };
}

export function getDemandWeight(project: ProjectForHeatmap): number {
  return analyzeDemandZone(project).weight;
}
