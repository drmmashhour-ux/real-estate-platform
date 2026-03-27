import { getExternalMortgageReadinessSanitized } from "@/lib/trustgraph/infrastructure/services/externalApiService";

export async function getExternalMortgageReadiness(mortgageRequestId: string) {
  return getExternalMortgageReadinessSanitized(mortgageRequestId);
}
