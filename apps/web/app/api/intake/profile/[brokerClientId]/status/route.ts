import { NextRequest, NextResponse } from "next/server";
import type { ClientIntakeStatus } from "@prisma/client";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getBrokerClientForIntake, requireIntakeUser } from "@/modules/intake/services/api-helpers";
import { canTransitionIntakeStatus } from "@/modules/intake/services/intake-status-machine";
import { canManageRequiredDocuments, canViewIntakeProfile } from "@/modules/intake/services/intake-permissions";
import { logIntakeEvent } from "@/modules/intake/services/log-intake-event";
import { notifyIntakeCompleted } from "@/modules/intake/services/intake-notifications";
import { onIntakeCompleted } from "@/modules/notifications/services/workflow-notification-triggers";

export const dynamic = "force-dynamic";

const STATUSES = new Set<ClientIntakeStatus>([
  "NOT_STARTED",
  "IN_PROGRESS",
  "UNDER_REVIEW",
  "COMPLETE",
  "ON_HOLD",
]);

type RouteCtx = { params: Promise<{ brokerClientId: string }> };

/**
 * POST /api/intake/profile/[brokerClientId]/status
 * Body: { status: ClientIntakeStatus }
 */
export async function POST(request: NextRequest, ctx: RouteCtx) {
  const user = await requireIntakeUser(request);
  if (user instanceof NextResponse) return user;

  const { brokerClientId } = await ctx.params;
  const bc = await getBrokerClientForIntake(brokerClientId);
  if (!bc) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  if (!canViewIntakeProfile({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canManageRequiredDocuments({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  const next = body?.status as ClientIntakeStatus | undefined;
  if (!next || !STATUSES.has(next)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  let profile = bc.intakeProfile;
  if (!profile) {
    profile = await prisma.clientIntakeProfile.create({
      data: { brokerClientId, userId: bc.userId ?? undefined },
    });
    await logIntakeEvent({
      type: "INTAKE_CREATED",
      brokerClientId,
      intakeProfileId: profile.id,
      actorId: user.userId,
    });
  }

  const current = profile.status;
  if (!canTransitionIntakeStatus(current, next, user.role)) {
    return NextResponse.json(
      { error: "Invalid status transition", current, next },
      { status: 400 }
    );
  }

  const updated = await prisma.clientIntakeProfile.update({
    where: { id: profile.id },
    data: {
      status: next,
      completedAt: next === "COMPLETE" ? new Date() : null,
    },
  });

  await logIntakeEvent({
    type: "STATUS_CHANGED",
    brokerClientId,
    intakeProfileId: updated.id,
    actorId: user.userId,
    message: `${current} → ${next}`,
    metadata: { from: current, to: next },
  });

  if (next === "COMPLETE") {
    notifyIntakeCompleted({ brokerClientId });
    void trackDemoEvent(DemoEvents.INTAKE_COMPLETED, { brokerClientId }, user.userId);
    void onIntakeCompleted({
      clientUserId: bc.userId,
      brokerUserId: bc.brokerId,
      brokerClientId,
    });
  }

  return NextResponse.json({ profile: updated });
}
