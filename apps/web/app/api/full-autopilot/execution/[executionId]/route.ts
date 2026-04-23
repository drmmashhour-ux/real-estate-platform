import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { getExecutionReviewDetail } from "@/modules/autopilot-review/autopilot-review.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ executionId: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { executionId } = await ctx.params;
  const detail = await getExecutionReviewDetail(executionId);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(detail);
}
