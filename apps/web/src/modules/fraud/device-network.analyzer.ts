import { fraudTrustV1Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

export type DeviceNetworkInsight = {
  userId: string;
  activeSessionCount: number;
  sessionsLast7d: number;
  /** 0–1 heuristic — IP/device fingerprinting requires richer telemetry not stored on Session today. */
  networkAnomalyScore: number;
  explanation: string[];
  dataLimitation: string;
};

/**
 * Session-based footprint — **not** full device/IP graph (extend when telemetry is privacy-compliant).
 */
export async function analyzeUserDeviceNetwork(userId: string): Promise<DeviceNetworkInsight | null> {
  if (!fraudTrustV1Flags.deviceAnalysisV1) return null;

  const since = new Date(Date.now() - 7 * 86400000);
  const [activeSessionCount, sessionsLast7d] = await Promise.all([
    prisma.session.count({ where: { userId, revoked: false, expiresAt: { gt: new Date() } } }),
    prisma.session.count({ where: { userId, createdAt: { gte: since } } }),
  ]);

  let networkAnomalyScore = 0.12;
  const explanation: string[] = [];
  if (sessionsLast7d > 25) {
    networkAnomalyScore = 0.42;
    explanation.push("High session churn vs typical — worth correlating with other signals (admin).");
  } else if (activeSessionCount > 6) {
    networkAnomalyScore = 0.28;
    explanation.push("Many concurrent sessions — verify account sharing vs compromise (admin).");
  } else {
    explanation.push("Session footprint within a normal band for this proxy.");
  }

  return {
    userId,
    activeSessionCount,
    sessionsLast7d,
    networkAnomalyScore,
    explanation,
    dataLimitation:
      "IP and device fingerprint hashes are not stored on `Session` in this schema — network score is session-count proxy only (Quebec Law 25: collect minimum necessary).",
  };
}
