import type { QaChecklistItemStatus } from "@prisma/client";
import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { complianceAuditKeys, logComplianceAudit } from "@/lib/admin/compliance-audit";
import { prisma } from "@/lib/db";
import { updateChecklistItem } from "@/modules/qa-review/review-checklist.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.brokerageQaReviewV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const { id: reviewId } = await ctx.params;

  let body: { checklistItemId?: string; status?: QaChecklistItemStatus; reviewerNote?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.checklistItemId) {
    return Response.json({ error: "checklistItemId required" }, { status: 400 });
  }

  const existing = await prisma.qaReviewChecklistItem.findUnique({
    where: { id: body.checklistItemId },
    select: { reviewId: true },
  });
  if (!existing || existing.reviewId !== reviewId) {
    return Response.json({ error: "Checklist item not found" }, { status: 404 });
  }

  const item = await updateChecklistItem(body.checklistItemId, {
    status: body.status,
    reviewerNote: body.reviewerNote,
  });

  await logComplianceAudit({
    actorUserId: admin.userId,
    actionKey: complianceAuditKeys.checklistUpdated,
    reviewId,
    payload: { checklistItemId: body.checklistItemId, status: body.status ?? null },
  });

  return Response.json({ item, updatedBy: admin.userId });
}
