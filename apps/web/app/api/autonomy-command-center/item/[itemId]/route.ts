import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { getExecutionReviewDetail } from "@/modules/autopilot-review/autopilot-review.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ itemId: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { itemId } = await ctx.params;

  const execution = await getExecutionReviewDetail(itemId);
  if (execution) {
    return NextResponse.json({
      kind: "execution" as const,
      detail: execution,
    });
  }

  const approval = await prisma.platformAutopilotAction.findUnique({
    where: { id: itemId },
    include: { decisions: { orderBy: { createdAt: "desc" }, take: 15 } },
  });

  if (approval && approval.entityType === "lecipm_full_autopilot") {
    return NextResponse.json({
      kind: "approval_action" as const,
      approval,
    });
  }

  return NextResponse.json({ error: "not_found" }, { status: 404 });
}
