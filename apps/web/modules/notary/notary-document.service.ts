import { prisma } from "@/lib/db";
import type { NotaryDealSummary } from "./notary.types";

/**
 * Non-PII summary for notary coordination — full documents flow through broker-controlled channels.
 */
export async function buildNotaryDealSummary(dealId: string): Promise<NotaryDealSummary | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      dealCode: true,
      priceCents: true,
      lecipmExecutionPipelineState: true,
      buyerId: true,
      sellerId: true,
      brokerId: true,
    },
  });
  if (!deal) return null;

  const parties: { role: string; label: string }[] = [];
  if (deal.buyerId) parties.push({ role: "buyer", label: "Buyer (platform id redacted)" });
  if (deal.sellerId) parties.push({ role: "seller", label: "Seller (platform id redacted)" });
  if (deal.brokerId) parties.push({ role: "broker", label: "Listing broker" });

  return {
    dealId: deal.id,
    dealCode: deal.dealCode,
    priceCents: deal.priceCents,
    pipelineState: deal.lecipmExecutionPipelineState ?? "unknown",
    parties,
    disclaimer:
      "Summary for coordination only. Executed instruments and identity verification follow applicable law and brokerage policy.",
  };
}
