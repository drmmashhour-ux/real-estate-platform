import type { QaReviewOutcome, QaReviewStatus } from "@prisma/client";
import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { setReviewOutcome } from "@/modules/qa-review/review-outcome.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.brokerageQaReviewV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const { id } = await ctx.params;

  let body: { outcome?: QaReviewOutcome; status?: QaReviewStatus; notes?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.outcome) {
    return Response.json({ error: "outcome required" }, { status: 400 });
  }

  const review = await setReviewOutcome(id, admin.userId, {
    outcome: body.outcome,
    status: body.status,
    notes: body.notes,
  });
  return Response.json({ review });
}
