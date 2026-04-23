import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getBrokerClientForIntake, requireIntakeUser } from "@/modules/intake/services/api-helpers";
import { canReviewRequiredDocument, canViewIntakeProfile } from "@/modules/intake/services/intake-permissions";
import {
  canTransitionRequiredDocumentStatus,
  getAllowedDocumentStatusTransitions,
} from "@/modules/intake/services/intake-status-machine";
import { logIntakeEvent } from "@/modules/intake/services/log-intake-event";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * POST /api/intake/required-documents/[id]/waive
 * Body: { note?: string }
 */
export async function POST(request: NextRequest, ctx: RouteCtx) {
  const user = await requireIntakeUser(request);
  if (user instanceof NextResponse) return user;

  const { id } = await ctx.params;
  const item = await prisma.requiredDocumentItem.findFirst({
    where: { id, deletedAt: null },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bc = await getBrokerClientForIntake(item.brokerClientId);
  if (!bc || !canViewIntakeProfile({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canReviewRequiredDocument({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { note?: string | null } | null;
  const note = body?.note?.trim();

  const next = "WAIVED" as const;
  if (
    !canTransitionRequiredDocumentStatus(item.status, next, user.role, {
      isBrokerOrAdmin: true,
      isClient: false,
    })
  ) {
    return NextResponse.json(
      { error: "Invalid transition", allowed: getAllowedDocumentStatusTransitions(item.status) },
      { status: 400 }
    );
  }

  const notesCombined = note
    ? [item.notes, `Waived: ${note}`].filter(Boolean).join("\n")
    : item.notes;

  const updated = await prisma.requiredDocumentItem.update({
    where: { id: item.id },
    data: {
      status: next,
      reviewedById: user.userId,
      notes: notesCombined ?? undefined,
    },
  });

  await logIntakeEvent({
    type: "DOCUMENT_WAIVED",
    brokerClientId: item.brokerClientId,
    intakeProfileId: item.intakeProfileId,
    requiredDocumentItemId: item.id,
    actorId: user.userId,
    message: note ?? "Requirement waived",
  });

  return NextResponse.json({ item: updated });
}
