import type { Deal } from "@prisma/client";

export function validateRequiredParties(deal: Deal & { dealParties?: { fullName: string }[] }): string[] {
  const missing: string[] = [];
  if (!deal.dealParties?.length) missing.push("deal_parties");
  return missing;
}
