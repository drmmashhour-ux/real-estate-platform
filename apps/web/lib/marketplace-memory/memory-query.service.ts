import { intelligenceFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { logMemoryAudit } from "@/lib/marketplace-memory/memory-audit";

export async function getUserMemoryProfile(userId: string, opts?: { auditRead?: boolean; actorId?: string | null }) {
  if (!intelligenceFlags.marketplaceMemoryEngineV1) return null;
  const row = await prisma.userMemoryProfile.findUnique({ where: { userId } });
  if (opts?.auditRead) {
    void logMemoryAudit({
      userId,
      actionType: "memory_read",
      summary: "Memory profile read",
      actorId: opts.actorId ?? userId,
    }).catch(() => null);
  }
  return row;
}

export async function getUserInsights(userId: string, take = 50) {
  if (!intelligenceFlags.marketplaceMemoryEngineV1) return [];
  return prisma.userMemoryInsight.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getSessionIntent(userId: string, sessionId: string) {
  if (!intelligenceFlags.marketplaceMemoryEngineV1) return null;
  return prisma.userMemorySession.findUnique({
    where: { userId_sessionId: { userId, sessionId: sessionId.slice(0, 128) } },
  });
}

/**
 * Sanitized signals for ranking / recommendation / negotiation assistants (no manipulative copy).
 */
export async function getMemorySignalsForEngine(
  userId: string,
  sessionId?: string | null,
): Promise<Record<string, unknown>> {
  if (!intelligenceFlags.marketplaceMemoryEngineV1) return {};

  const profile = await prisma.userMemoryProfile.findUnique({ where: { userId } });
  if (!profile?.personalizationEnabled) return {};

  void logMemoryAudit({
    userId,
    actionType: "memory_used_in_engine",
    summary: "Memory signals consumed by downstream engine",
    details: { sessionId: sessionId ?? null },
  }).catch(() => null);

  const session =
    sessionId != null && sessionId.length > 0
      ? await prisma.userMemorySession.findUnique({
          where: { userId_sessionId: { userId, sessionId: sessionId.slice(0, 128) } },
        })
      : null;

  return {
    personalizationEnabled: true,
    role: profile.role,
    intentSummary: profile.intentSummaryJson,
    preferenceSummary: profile.preferenceSummaryJson,
    behaviorSummary: profile.behaviorSummaryJson,
    financialProfile: profile.financialProfileJson,
    esgProfile: profile.esgProfileJson,
    riskProfile: profile.riskProfileJson,
    sessionIntent: session?.activeIntentJson ?? null,
    lastUpdatedAt: profile.lastUpdatedAt.toISOString(),
  };
}

export async function exportUserMemoryJson(userId: string, actorId?: string | null) {
  void logMemoryAudit({
    userId,
    actionType: "memory_export",
    summary: "Full marketplace memory export",
    actorId: actorId ?? userId,
  }).catch(() => null);

  const [profile, events, insights, sessions] = await Promise.all([
    prisma.userMemoryProfile.findUnique({ where: { userId } }),
    prisma.userMemoryEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
    prisma.userMemoryInsight.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.userMemorySession.findMany({ where: { userId }, orderBy: { lastActivityAt: "desc" }, take: 50 }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile,
    events,
    insights,
    sessions,
  };
}
