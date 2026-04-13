import type { DealFinancingCoordinationStatus } from "@prisma/client";

export type { DealFinancingCoordinationStatus };

/** RH-style lender info fields (stored in lenderMetadata JSON; not validated as legal facts). */
export type LenderMetadataV1 = {
  mortgageBalanceCents?: number | null;
  maturityDate?: string | null;
  penaltyNotes?: string | null;
  assumable?: boolean | null;
  lineOfCredit?: boolean | null;
  securedCard?: boolean | null;
  institutionResponseNotes?: string | null;
};
