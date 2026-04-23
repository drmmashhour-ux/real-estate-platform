import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import { canAccessDealAnalysisForListing } from "@/lib/appraisal/deal-analysis-access";
import { adjustedPriceCents } from "@/lib/appraisal/adjustment-math";

export const dynamic = "force-dynamic";

/** GET — proposals + applied adjustments + chart rows for one comparable. */
export async function GET(req: Request) {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const appraisalCaseId = searchParams.get("appraisalCaseId") ?? "";
  const comparableId = searchParams.get("comparableId") ?? "";

  if (!appraisalCaseId) {
    return NextResponse.json({ error: "appraisalCaseId required" }, { status: 400 });
  }

  const allowed = await canAccessDealAnalysisForListing(appraisalCaseId, auth.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const proposals = await prisma.appraisalAdjustmentProposal.findMany({
    where: {
      appraisalCaseId,
      ...(comparableId ? { comparableId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  const applied = await prisma.appraisalAdjustment.findMany({
    where: {
      appraisalCaseId,
      ...(comparableId ? { comparableId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  let chart: { name: string; original: number; adjusted: number }[] = [];
  if (comparableId) {
    const comp = await prisma.dealAnalysisComparable.findUnique({
      where: { id: comparableId },
      select: { id: true, priceCents: true, comparablePropertyId: true },
    });
    if (comp) {
      const listing = await prisma.fsboListing.findUnique({
        where: { id: comp.comparablePropertyId },
        select: { address: true },
      });
      const forComp = applied.filter((a) => a.comparableId === comparableId);
      const adj = forComp.map((a) => ({ amountCents: a.amountCents, direction: a.direction }));
      const original = Math.round(comp.priceCents / 100);
      const adjusted = Math.round(adjustedPriceCents(comp.priceCents, adj) / 100);
      chart = [{ name: listing?.address?.slice(0, 28) ?? "Comparable", original, adjusted }];
    }
  }

  return NextResponse.json({ proposals, applied, chart });
}
