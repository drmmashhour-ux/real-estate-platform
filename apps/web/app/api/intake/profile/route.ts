import { NextRequest, NextResponse } from "next/server";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { prisma } from "@/lib/db";
import { getBrokerClientForIntake, requireIntakeUser } from "@/modules/intake/services/api-helpers";
import { canViewIntakeProfile } from "@/modules/intake/services/intake-permissions";
import { logIntakeEvent } from "@/modules/intake/services/log-intake-event";

export const dynamic = "force-dynamic";

/**
 * POST /api/intake/profile — create intake profile for a broker client if missing.
 * Body: { brokerClientId: string }
 */
export async function POST(request: NextRequest) {
  const user = await requireIntakeUser(request);
  if (user instanceof NextResponse) return user;

  const body = (await request.json().catch(() => null)) as { brokerClientId?: string } | null;
  const brokerClientId = body?.brokerClientId?.trim();
  if (!brokerClientId) {
    return NextResponse.json({ error: "brokerClientId is required" }, { status: 400 });
  }

  const bc = await getBrokerClientForIntake(brokerClientId);
  if (!bc) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  if (!canViewIntakeProfile({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.clientIntakeProfile.findUnique({
    where: { brokerClientId },
  });
  if (existing) {
    return NextResponse.json({ profile: existing, created: false });
  }

  const profile = await prisma.clientIntakeProfile.create({
    data: {
      brokerClientId,
      userId: bc.userId ?? undefined,
    },
  });

  await logIntakeEvent({
    type: "INTAKE_CREATED",
    brokerClientId,
    intakeProfileId: profile.id,
    actorId: user.userId,
    message: "Intake profile created",
  });

  void trackDemoEvent(
    DemoEvents.INTAKE_PROFILE_CREATED,
    { brokerClientId },
    user.userId
  );

  return NextResponse.json({ profile, created: true });
}
