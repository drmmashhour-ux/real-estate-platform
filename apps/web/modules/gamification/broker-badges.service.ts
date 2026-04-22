import { prisma } from "@/lib/db";
import type { BadgeCode } from "@/modules/gamification/broker-gamification.types";

const BADGE_META: Record<
  BadgeCode,
  { title: string; description: string }
> = {
  FIRST_DEAL: {
    title: "First Deal",
    description: "Completed your first broker-scoped transaction milestone.",
  },
  FAST_RESPONDER: {
    title: "Fast Responder",
    description: "Answered inbound leads within one hour multiple times.",
  },
  COMPLIANCE_STAR: {
    title: "Compliance Star",
    description: "Maintains verified broker status with clean signals.",
  },
  DOCUMENT_PRO: {
    title: "Document Pro",
    description: "Generated and finalized core transaction documents.",
  },
  TOP_CONVERTER: {
    title: "Top Converter",
    description: "Strong lead-to-progress ratio without spam tactics.",
  },
  TRUSTED_BROKER: {
    title: "Trusted Broker",
    description: "High compliance quality and consistent activity.",
  },
  STREAK_7: {
    title: "7-Day Streak",
    description: "Seven consecutive active days on the platform.",
  },
  STREAK_30: {
    title: "30-Day Streak",
    description: "Thirty consecutive active days — sustained excellence.",
  },
};

export async function tryAwardBadge(brokerId: string, code: BadgeCode): Promise<boolean> {
  const meta = BADGE_META[code];
  try {
    await prisma.brokerBadge.create({
      data: {
        brokerId,
        badgeCode: code,
        title: meta.title,
        description: meta.description,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function listBadges(brokerId: string) {
  return prisma.brokerBadge.findMany({
    where: { brokerId },
    orderBy: { earnedAt: "desc" },
  });
}

export function lockedBadgeHints(codesEarned: Set<string>): string[] {
  const all = Object.keys(BADGE_META) as BadgeCode[];
  return all
    .filter((c) => !codesEarned.has(c))
    .slice(0, 6)
    .map((c) => `${BADGE_META[c].title}: ${BADGE_META[c].description}`);
}
