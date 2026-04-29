import type { HostReputationTier } from "@/lib/ai/reputation/reputation-types";

export function hostReputationTierLabel(tier: HostReputationTier): string {
  switch (tier) {
    case "elite":
      return "Elite host";
    case "established":
      return "Established host";
    case "growth":
      return "Growing host";
    case "starter":
    default:
      return "New host";
  }
}
