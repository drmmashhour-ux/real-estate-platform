import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { canManageCapital } from "@/modules/capital/capital-policy";
import { generateLenderPackage } from "@/modules/capital/lender-package.service";
import { markPackageSent } from "@/modules/capital/lender.service";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";

export const dynamic = "force-dynamic";

/** Generate structured lender package and mark lender PACKAGE_SENT. */
export async function POST(_req: Request, context: { params: Promise<{ lenderId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { lenderId } = await context.params;

  try {
    const lender = await prisma.lecipmPipelineDealLender.findUnique({ where: { id: lenderId } });
    if (!lender) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const deal = await prisma.lecipmPipelineDeal.findUnique({ where: { id: lender.dealId } });
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal) || !canManageCapital(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = await generateLenderPackage(lender.dealId);
    await markPackageSent(lenderId, auth.userId);

    return NextResponse.json({
      lenderPackage: payload,
      format: "json",
      note: "PDF export can wrap summaryText or embed JSON client-side.",
    });
  } catch (e) {
    logError("[api.deals.lenders.package.post]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
