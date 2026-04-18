import { seasonalityMultiplier } from "@/lib/bnhub/smart-pricing";

export function seasonalMultiplierForDate(isoDate?: string): number {
  const d = isoDate ? new Date(isoDate) : new Date();
  return seasonalityMultiplier(d.getMonth() + 1);
}
