import type { InsuranceLeadSource, InsuranceLeadType } from "@prisma/client";

export type LeadScoreInput = {
  phone: string | null | undefined;
  bookingId: string | null | undefined;
  source: InsuranceLeadSource;
  leadType: InsuranceLeadType;
  listingId: string | null | undefined;
};

/**
 * Simple quality score for routing and pricing. Threshold for “high quality” is defined in `pricing.ts`.
 */
export function scoreInsuranceLead(lead: LeadScoreInput): number {
  let s = 0;
  if (lead.phone?.trim()) s += 10;
  if (lead.bookingId?.trim()) s += 10;
  if (lead.source === "CHECKOUT") s += 5;
  if (lead.leadType === "PROPERTY" && lead.listingId?.trim()) s += 5;
  return s;
}
