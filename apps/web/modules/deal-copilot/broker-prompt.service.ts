import type { Deal } from "@prisma/client";

export function buildBrokerPrompt(deal: Deal): string {
  return `Review deal ${deal.dealCode ?? deal.id}: confirm official OACIQ forms version, party identities, and all conditions before signing.`;
}
