import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/get-session";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { assertComplianceOwnerAccess } from "@/lib/compliance/compliance-access";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const reviewId = typeof body.reviewId === "string" ? body.reviewId.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim() : "";
  const note = typeof body.note === "string" ? body.note : null;

  if (!reviewId || !status) {
    return NextResponse.json({ success: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const existing = await prisma.complianceManualReviewQueue.findUnique({ where: { id: reviewId } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const access = await assertComplianceOwnerAccess(user, existing.ownerType, existing.ownerId);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.message }, { status: 403 });
  }

  const review = await prisma.complianceManualReviewQueue.update({
    where: { id: reviewId },
    data: { status },
  });

  await logAuditEvent({
    ownerType: review.ownerType,
    ownerId: review.ownerId,
    entityType: "manual_review",
    entityId: review.id,
    actionType: status,
    moduleKey: "general",
    actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: user.id,
    severity: status === "rejected" ? "high" : "info",
    summary: `Manual review ${status}`,
    details: {
      note: note ?? null,
      moduleKey: review.moduleKey,
      actionKey: review.actionKey,
    },
  });

  return NextResponse.json({ success: true, review });
}
