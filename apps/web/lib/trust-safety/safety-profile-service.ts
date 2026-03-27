/**
 * User and listing safety profiles: risk scores, complaint counts, repeat offender tracking.
 */

import { prisma } from "@/lib/db";
import type { RiskLevel } from "./engine-constants";

/** Get or create user safety profile. */
export async function getUserSafetyProfile(userId: string) {
  let profile = await prisma.userSafetyProfile.findUnique({
    where: { userId },
  });
  if (!profile) {
    profile = await prisma.userSafetyProfile.create({
      data: { userId },
    });
  }
  return profile;
}

/** Get or create listing safety profile. */
export async function getListingSafetyProfile(listingId: string) {
  let profile = await prisma.listingSafetyProfile.findUnique({
    where: { listingId },
  });
  if (!profile) {
    profile = await prisma.listingSafetyProfile.create({
      data: { listingId },
    });
  }
  return profile;
}

/** Update user profile after incident (e.g. increment seriousIncidentCount). */
export async function updateUserSafetyProfile(
  userId: string,
  updates: {
    hostRiskScore?: number;
    guestRiskScore?: number;
    warningCount?: number;
    suspensionCount?: number;
    seriousIncidentCount?: number;
  }
): Promise<void> {
  await prisma.userSafetyProfile.upsert({
    where: { userId },
    create: { userId, ...updates },
    update: updates,
  });
}

/** Update listing profile after incident. */
export async function updateListingSafetyProfile(
  listingId: string,
  updates: {
    safetyScore?: number;
    complaintCount?: number;
    unsafeIncidentCount?: number;
    fraudIncidentCount?: number;
  }
): Promise<void> {
  await prisma.listingSafetyProfile.upsert({
    where: { listingId },
    create: { listingId, ...updates },
    update: updates,
  });
}

/** Compute host risk level from profile and recent incidents. */
export async function computeHostRiskLevel(userId: string): Promise<{ score: number; level: RiskLevel }> {
  const profile = await getUserSafetyProfile(userId);
  const incidents = await prisma.trustSafetyIncident.count({
    where: { accusedUserId: userId },
  });
  const serious = await prisma.trustSafetyIncident.count({
    where: {
      accusedUserId: userId,
      severityLevel: { in: ["HIGH", "EMERGENCY"] },
      status: { not: "CLOSED" },
    },
  });

  let score = profile.hostRiskScore ?? 0;
  if (incidents > 0) score = Math.min(1, score + incidents * 0.1);
  if (profile.seriousIncidentCount) score = Math.min(1, score + profile.seriousIncidentCount * 0.2);
  if (profile.suspensionCount) score = Math.min(1, score + profile.suspensionCount * 0.3);

  const level: RiskLevel =
    score >= 0.8 ? "CRITICAL_RISK" : score >= 0.5 ? "HIGH_RISK" : score >= 0.2 ? "MEDIUM_RISK" : "LOW_RISK";
  return { score, level };
}

/** Compute listing safety score (higher = safer). */
export async function computeListingSafetyScore(listingId: string): Promise<number> {
  const profile = await getListingSafetyProfile(listingId);
  const unsafe = profile.unsafeIncidentCount + (await prisma.trustSafetyIncident.count({
    where: {
      listingId,
      incidentCategory: "unsafe_property",
    },
  }));
  const fraud = profile.fraudIncidentCount;
  const complaints = profile.complaintCount;
  const base = 1 - (unsafe * 0.3 + fraud * 0.4 + complaints * 0.05);
  return Math.max(0, Math.min(1, base));
}
