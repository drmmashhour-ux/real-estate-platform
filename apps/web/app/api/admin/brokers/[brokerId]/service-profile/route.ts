import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  brokerServiceProfileFlags,
  brokerTeamViewFlags,
  brokerTeamViewPanelFlags,
} from "@/config/feature-flags";
import { buildProfileConfidenceAndMergeNotes } from "@/modules/broker/profile/broker-profile-confidence.service";
import { buildObservedProfileSignalsForBrokers } from "@/modules/broker/profile/broker-observed-profile-signals.service";
import { getDeclaredStoredProfilesByBrokerIds, getBrokerServiceProfile } from "@/modules/broker/profile/broker-service-profile.service";

const ADMIN_SURFACE_ROLES = new Set<PlatformRole>(["ADMIN", "ACCOUNTANT"]);

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ brokerId: string }> }) {
  const teamSurface =
    brokerTeamViewFlags.brokerTeamViewV1 && brokerTeamViewPanelFlags.brokerTeamViewPanelV1;
  const profileSurface =
    brokerServiceProfileFlags.brokerServiceProfileV1 ||
    brokerServiceProfileFlags.brokerSpecializationRoutingV1 ||
    brokerServiceProfileFlags.brokerServiceProfilePanelV1;

  if (!teamSurface && !profileSurface) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || !ADMIN_SURFACE_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { brokerId } = await ctx.params;

  const broker = await prisma.user.findUnique({
    where: { id: brokerId },
    select: { id: true, role: true },
  });
  if (!broker || broker.role !== "BROKER") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [declaredProfile, storedMap, observedMap] = await Promise.all([
    getBrokerServiceProfile(brokerId),
    getDeclaredStoredProfilesByBrokerIds([brokerId]),
    buildObservedProfileSignalsForBrokers([brokerId], { windowDays: 90 }),
  ]);

  const stored = storedMap.get(brokerId)!;
  const merge = buildProfileConfidenceAndMergeNotes(stored);
  const observed = observedMap.get(brokerId) ?? null;

  return NextResponse.json({
    brokerId,
    declaredProfile,
    declaredStored: stored,
    observedProfileSignals: observed,
    profileConfidence: merge.profileConfidence,
    mergeExplanationNotes: merge.explanationNotes,
    disclaimer:
      "Declared rows are broker- or admin-edited JSON. Observed counts are CRM history — advisory only, never auto-written as expertise.",
  });
}
