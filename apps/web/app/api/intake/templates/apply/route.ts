import { NextRequest, NextResponse } from "next/server";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { prisma } from "@repo/db";
import { applyIntakeTemplate } from "@/modules/intake/services/apply-intake-template";
import { getBrokerClientForIntake, requireIntakeUser } from "@/modules/intake/services/api-helpers";
import { calculateChecklistProgress } from "@/modules/intake/services/calculate-checklist-progress";
import { canManageRequiredDocuments, canViewIntakeProfile } from "@/modules/intake/services/intake-permissions";
import { isValidIntakeTemplateKey } from "@/modules/intake/services/intake-templates";

export const dynamic = "force-dynamic";

/**
 * POST /api/intake/templates/apply
 * Body: { brokerClientId: string, templateKey: string }
 */
export async function POST(request: NextRequest) {
  const user = await requireIntakeUser(request);
  if (user instanceof NextResponse) return user;

  const body = (await request.json().catch(() => null)) as {
    brokerClientId?: string;
    templateKey?: string;
  } | null;

  const brokerClientId = body?.brokerClientId?.trim();
  const templateKey = body?.templateKey?.trim();
  if (!brokerClientId || !templateKey) {
    return NextResponse.json({ error: "brokerClientId and templateKey required" }, { status: 400 });
  }

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

  if (!isValidIntakeTemplateKey(templateKey)) {
    return NextResponse.json({ error: "Unknown templateKey" }, { status: 400 });
  }

  let profile = bc.intakeProfile;
  if (!profile) {
    profile = await prisma.clientIntakeProfile.create({
      data: { brokerClientId, userId: bc.userId ?? undefined },
    });
  }

  try {
    const { created, skipped } = await applyIntakeTemplate({
      brokerClientId,
      intakeProfileId: profile.id,
      templateKey,
      actorId: user.userId,
    });
    void trackDemoEvent(
      DemoEvents.INTAKE_TEMPLATE_APPLIED,
      { templateKey, createdCount: created.length, skipped },
      user.userId
    );

    const items = await prisma.requiredDocumentItem.findMany({
      where: { brokerClientId, deletedAt: null },
    });
    const progress = calculateChecklistProgress(items);

    return NextResponse.json({ created, skipped, progress });
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_TEMPLATE") {
      return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    }
    throw e;
  }
}
