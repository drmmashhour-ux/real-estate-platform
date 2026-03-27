import type { TrustLevel } from "@prisma/client";

export function trustBadgeLabel(level: TrustLevel): string {
  switch (level) {
    case "verified":
      return "Verified";
    case "high":
      return "High trust";
    case "medium":
      return "Medium trust";
    case "low":
    default:
      return "Needs review";
  }
}
