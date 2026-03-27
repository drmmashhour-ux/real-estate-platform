/**
 * Lightweight heuristic fraud signals (0–100 risk). Explainable rules only.
 * For production, combine with Trust & Safety workflows + manual review.
 */

import { prisma } from "@/lib/db";

export type FraudHeuristicResult = {
  userId: string;
  riskScore: number;
  flags: string[];
};

export async function evaluateUserHeuristic(userId: string): Promise<FraudHeuristicResult> {
  const flags: string[] = [];
  let risk = 5;

  const [user, recentLogs, msgs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { accountStatus: true, createdAt: true, email: true },
    }),
    prisma.aiUserActivityLog.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    }),
    prisma.bookingMessage.count({ where: { senderId: userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }).catch(() => 0),
  ]);

  if (!user) {
    return { userId, riskScore: 0, flags: ["user_not_found"] };
  }

  if (user.accountStatus === "SUSPENDED" || user.accountStatus === "BANNED") {
    risk += 60;
    flags.push("account_not_active");
  }

  const email = user.email.toLowerCase();
  if (/\+|tempmail|disposable|mailinator/i.test(email)) {
    risk += 15;
    flags.push("email_pattern_suspicious");
  }

  if (recentLogs > 200) {
    risk += 20;
    flags.push("very_high_activity_velocity_1h");
  }

  if (msgs > 80) {
    risk += 15;
    flags.push("high_outbound_messages_24h");
  }

  risk = Math.min(100, Math.max(0, risk));

  await prisma.userAiProfile.upsert({
    where: { userId },
    create: {
      userId,
      fraudHeuristicScore: risk,
      aiFlags: { fraudHeuristic: flags },
    },
    update: {
      fraudHeuristicScore: risk,
      aiFlags: { fraudHeuristic: flags },
    },
  });

  return { userId, riskScore: risk, flags };
}
