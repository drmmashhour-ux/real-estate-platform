import { RolloutPolicyDomain } from "@prisma/client";

export function mapEvolutionDomainToRolloutDomain(evolutionDomain: string): RolloutPolicyDomain {
  switch (evolutionDomain) {
    case "DEAL":
    case "BOOKING":
    case "FUND":
    case "CAPITAL":
      return RolloutPolicyDomain.DEAL;
    case "MESSAGING":
    case "BNHUB":
      return RolloutPolicyDomain.MESSAGING;
    case "LECIPM":
      return RolloutPolicyDomain.RANKING;
    case "SHARED":
    default:
      return RolloutPolicyDomain.ESG;
  }
}
