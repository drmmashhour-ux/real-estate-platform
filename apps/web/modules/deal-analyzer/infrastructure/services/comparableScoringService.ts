import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import type { ComparableCandidate } from "@/modules/deal-analyzer/domain/comparables";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function distanceKmBetween(
  a: { latitude: number | null; longitude: number | null },
  b: { latitude: number | null; longitude: number | null },
): number | null {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) {
    return null;
  }
  return haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
}

/**
 * Deterministic 0–1 similarity; higher is more similar. Uses config weights.
 */
export function scoreComparableSimilarity(subject: ComparableCandidate, candidate: ComparableCandidate): number {
  const cfg = dealAnalyzerConfig.comparable.similarityWeights;
  let bed = 0;
  if (subject.bedrooms != null && candidate.bedrooms != null) {
    const d = Math.abs(subject.bedrooms - candidate.bedrooms);
    bed = clamp01(1 - d / Math.max(1, dealAnalyzerConfig.comparable.bedroomTolerance + 0.01));
  } else {
    bed = 0.5;
  }

  let bath = 0;
  if (subject.bathrooms != null && candidate.bathrooms != null) {
    const d = Math.abs(subject.bathrooms - candidate.bathrooms);
    bath = clamp01(1 - d / Math.max(0.5, dealAnalyzerConfig.comparable.bathroomTolerance + 0.01));
  } else {
    bath = 0.5;
  }

  let area = 0;
  if (subject.areaSqft != null && candidate.areaSqft != null && subject.areaSqft > 0) {
    const rel = Math.abs(subject.areaSqft - candidate.areaSqft) / subject.areaSqft;
    area = clamp01(1 - rel / Math.max(0.05, dealAnalyzerConfig.comparable.areaRelativeTolerance));
  } else {
    area = 0.45;
  }

  let dist = 0.55;
  const km = distanceKmBetween(subject, candidate);
  if (km != null) {
    const max = Math.max(1, dealAnalyzerConfig.comparable.radiusKm);
    dist = clamp01(1 - km / max);
  }

  let pt = 0.5;
  if (subject.propertyType && candidate.propertyType) {
    pt = subject.propertyType === candidate.propertyType ? 1 : 0.35;
  }

  return (
    cfg.bedroom * bed +
    cfg.bathroom * bath +
    cfg.area * area +
    cfg.distance * dist +
    cfg.propertyType * pt
  );
}
