import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export type ReconciliationBucketStatus = "clear" | "review" | "blocked";

export async function hubReconciliationStatus(): Promise<{
  ledgerEntriesReviewed: number;
  openTaxPeriods: number;
  buckets: { name: string; status: ReconciliationBucketStatus; detail: string }[];
}> {
  const recent = await prisma.complianceFinanceLedgerEntry.count({
    where: {
      effectiveDate: { gte: new Date(Date.now() - 90 * 86400000) },
    },
  });

  const openObligations = await prisma.regulatoryObligation.count({
    where: { status: { in: ["OPEN", "DRAFT"] } },
  });

  return {
    ledgerEntriesReviewed: recent,
    openTaxPeriods: openObligations,
    buckets: [
      { name: "Brokerage", status: "review", detail: "Cross-check with trust register entries separately." },
      { name: "Platform", status: "review", detail: "Stripe / subscription truth vs hub ledger (manual tie-out)." },
      { name: "Investment", status: "review", detail: "SPV commitments vs bank / escrow simulation lines." },
    ],
  };
}
