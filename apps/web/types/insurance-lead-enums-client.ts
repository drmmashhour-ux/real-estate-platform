/** Insurance CRM hub — enums mirrored from Prisma. */

export type InsuranceLeadType = "TRAVEL" | "PROPERTY" | "MORTGAGE";

export type InsuranceLeadSource = "BNBHUB" | "LISTING" | "CHECKOUT" | "MANUAL";

export type InsuranceLeadStatus = "NEW" | "CONTACTED" | "SENT" | "CONVERTED" | "REJECTED";

export const InsuranceLeadStatusMirror = {
  NEW: "NEW" as InsuranceLeadStatus,
  CONTACTED: "CONTACTED" as InsuranceLeadStatus,
  SENT: "SENT" as InsuranceLeadStatus,
  CONVERTED: "CONVERTED" as InsuranceLeadStatus,
  REJECTED: "REJECTED" as InsuranceLeadStatus,
} as const;
