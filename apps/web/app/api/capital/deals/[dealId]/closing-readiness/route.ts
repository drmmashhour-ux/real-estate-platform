import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { prisma } from "@repo/db";
import { userCanAccessCapitalModule } from "@/modules/capital/capital-access";
import { computeClosingReadiness } from "@/modules/capital/closing-readiness.service";

export const dynamic = "force-dynamic";

const TAG = "[closing-readiness]";

export async function GET(_request: Request, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!(await userCanAccessCapitalModule(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const readiness = await computeClosingReadiness(dealId);

  const checklist = await prisma.investmentPipelineClosingChecklistItem.findMany({
    where: { pipelineDealId: dealId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ readiness, checklist });
}
