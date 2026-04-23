import { prisma } from "@/lib/db";
import type { ComputedPortfolio } from "@/lib/investor/computed-portfolio.types";

export type { ComputedPortfolio } from "@/lib/investor/computed-portfolio.types";

export async function computePortfolio(portfolioId: string): Promise<ComputedPortfolio | null> {
  const book = await prisma.portfolioBook.findUnique({
    where: { id: portfolioId },
    include: { properties: true },
  });

  if (!book) return null;

  const props = book.properties;
  const totalValueCents = props.reduce((s, p) => s + (p.currentValueCents ?? 0), 0);
  const totalCashflowCents = props.reduce((s, p) => s + (p.monthlyCashflowCents ?? 0), 0);

  const withCap = props.filter((p) => p.capRate != null && Number.isFinite(p.capRate));
  const withRoi = props.filter((p) => p.roiPercent != null && Number.isFinite(p.roiPercent));

  const avgCapRate =
    withCap.length > 0 ? withCap.reduce((s, p) => s + (p.capRate ?? 0), 0) / withCap.length : 0;
  const avgROI =
    withRoi.length > 0 ? withRoi.reduce((s, p) => s + (p.roiPercent ?? 0), 0) / withRoi.length : 0;

  return {
    id: book.id,
    title: book.title,
    totalValueCents,
    totalCashflowCents,
    avgCapRate,
    avgROI,
    properties: props,
  } satisfies ComputedPortfolio;
}
