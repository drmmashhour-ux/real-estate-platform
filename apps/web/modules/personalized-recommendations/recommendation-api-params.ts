import type { RecommendationMode } from "./recommendation.types";

const MODES: RecommendationMode[] = ["BUYER", "RENTER", "BROKER", "INVESTOR"];

export function parseRecommendationMode(raw: string | null): RecommendationMode {
  const u = (raw ?? "BUYER").toUpperCase();
  return MODES.includes(u as RecommendationMode) ? (u as RecommendationMode) : "BUYER";
}

export function parseBoolParam(raw: string | null, defaultTrue: boolean): boolean {
  if (raw == null || raw === "") return defaultTrue;
  const l = raw.toLowerCase();
  if (l === "0" || l === "false" || l === "off" || l === "no") return false;
  if (l === "1" || l === "true" || l === "on" || l === "yes") return true;
  return defaultTrue;
}
