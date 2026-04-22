import { prisma } from "@/lib/db";
import { getCapitalStack } from "./capital-stack.service";

export type LenderPackagePayload = {
  generatedAt: string;
  deal: {
    id: string;
    dealNumber: string;
    title: string;
    pipelineStage: string;
    latestTransactionNumber: string | null;
  };
  transaction: {
    id: string;
    transactionNumber: string;
    status: string | null;
    title: string | null;
  } | null;
  capitalStack: {
    totalPurchasePrice: number;
    equityAmount: number | null;
    debtAmount: number | null;
    loanToValue: number | null;
    debtServiceCoverage: number | null;
  } | null;
  documents: Array<{
    id: string;
    title: string;
    documentType: string;
    status: string;
    requiredForClosing: boolean;
  }>;
  esgNotes: string[];
  summaryText: string;
};

/**
 * Structured lender package payload. PDF export can wrap `summaryText` / JSON.
 * ESG: placeholder hooks when listing/property ESG fields exist on related records.
 */
export async function generateLenderPackage(dealId: string): Promise<LenderPackagePayload> {
  const deal = await prisma.lecipmPipelineDeal.findUnique({
    where: { id: dealId },
    include: {
      transaction: {
        include: {
          documents: {
            select: {
              id: true,
              title: true,
              documentType: true,
              status: true,
              requiredForClosing: true,
            },
            orderBy: { createdAt: "desc" },
            take: 80,
          },
        },
      },
      listing: { select: { id: true, title: true } },
    },
  });

  if (!deal) throw new Error("Deal not found");

  const stack = await getCapitalStack(dealId);
  const tx = deal.transaction;

  const esgNotes: string[] = [];
  if (deal.listing?.title) {
    esgNotes.push(`Listing context: ${deal.listing.title} (ESG detail not configured on listing in this build).`);
  }

  const summaryLines = [
    `Deal ${deal.dealNumber} — ${deal.title}`,
    deal.latestTransactionNumber || tx?.transactionNumber ?
      `Transaction: ${deal.latestTransactionNumber ?? tx?.transactionNumber}`
    : "No transaction linked",
    stack ?
      `Capital: purchase ${stack.totalPurchasePrice}, equity ${stack.equityAmount ?? "—"}, debt ${stack.debtAmount ?? "—"}, LTV ${stack.loanToValue != null ? `${stack.loanToValue.toFixed(2)}%` : "—"}`
    : "Capital stack not yet created",
    `Documents on file: ${tx?.documents?.length ?? 0}`,
  ];

  return {
    generatedAt: new Date().toISOString(),
    deal: {
      id: deal.id,
      dealNumber: deal.dealNumber,
      title: deal.title,
      pipelineStage: deal.pipelineStage,
      latestTransactionNumber: deal.latestTransactionNumber,
    },
    transaction:
      tx ?
        {
          id: tx.id,
          transactionNumber: tx.transactionNumber,
          status: tx.status,
          title: tx.title,
        }
      : null,
    capitalStack:
      stack ?
        {
          totalPurchasePrice: stack.totalPurchasePrice,
          equityAmount: stack.equityAmount,
          debtAmount: stack.debtAmount,
          loanToValue: stack.loanToValue,
          debtServiceCoverage: stack.debtServiceCoverage,
        }
      : null,
    documents:
      tx?.documents?.map((d) => ({
        id: d.id,
        title: d.title,
        documentType: d.documentType,
        status: d.status,
        requiredForClosing: d.requiredForClosing,
      })) ?? [],
    esgNotes,
    summaryText: summaryLines.join("\n"),
  };
}
