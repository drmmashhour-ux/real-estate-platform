import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { FunnelSnapshot } from "./growth.types";

const TAG = "[growth-engine]";

/**
 * Aggregates funnel metrics from across the platform.
 */
export async function getFunnelSnapshot(): Promise<FunnelSnapshot> {
  // Placeholder: In production, this would query TrafficEvent, LaunchEvent, User, etc.
  const snapshot: FunnelSnapshot = {
    traffic: 50000,
    signups: 1200,
    activationRate: 0.15,
    revenue: 45000,
    retention: 0.45,
    referralUsage: 0.05,
    landingConversion: 0.024,
    onboardingDropoff: 0.65,
    pricingConversion: 0.08,
  };

  logInfo(`${TAG} context_built`, { signupCount: snapshot.signups });
  return snapshot;
}

export async function identifyFunnelBottlenecks() {
  const snapshot = await getFunnelSnapshot();
  const bottlenecks: { stage: string; severity: "HIGH" | "MEDIUM" | "LOW"; message: string }[] = [];

  if (snapshot.onboardingDropoff > 0.5) {
    bottlenecks.push({
      stage: "Activation",
      severity: "HIGH",
      message: `Onboarding drop-off is ${Math.round(snapshot.onboardingDropoff * 100)}%. Critical friction detected.`,
    });
  }

  if (snapshot.landingConversion < 0.03) {
    bottlenecks.push({
      stage: "Acquisition",
      severity: "MEDIUM",
      message: `Landing conversion rate (${(snapshot.landingConversion * 100).toFixed(1)}%) is below 3% target.`,
    });
  }

  if (snapshot.referralUsage < 0.1) {
    bottlenecks.push({
      stage: "Viral Loop",
      severity: "LOW",
      message: "Referral participation is low. Viral growth engine is underutilized.",
    });
  }

  return bottlenecks;
}

export async function getStrongestChannels() {
  // @ts-ignore
  const playbook = await prisma.growthPlaybookMemory.findMany({
    orderBy: { score: "desc" },
    take: 3,
  });

  return playbook.map((p: any) => ({
    channel: p.channel,
    score: p.score,
    strategy: p.strategyKey,
  }));
}
