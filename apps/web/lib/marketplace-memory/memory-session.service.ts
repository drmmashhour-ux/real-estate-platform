import { intelligenceFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

function mergeIntent(existing: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};
  return { ...base, ...patch };
}

/**
 * Short-horizon session intent (e.g. city focus today) — can boost ranking without overwriting long-term profile.
 */
export async function touchMemorySession(params: {
  userId: string;
  sessionId: string;
  activeIntentPatch: Record<string, unknown>;
}): Promise<void> {
  if (!intelligenceFlags.marketplaceMemoryEngineV1) return;

  const row = await prisma.userMemorySession.findUnique({
    where: { userId_sessionId: { userId: params.userId, sessionId: params.sessionId } },
  });
  const merged = mergeIntent(row?.activeIntentJson ?? {}, params.activeIntentPatch);

  await prisma.userMemorySession.upsert({
    where: { userId_sessionId: { userId: params.userId, sessionId: params.sessionId } },
    create: {
      userId: params.userId,
      sessionId: params.sessionId.slice(0, 128),
      activeIntentJson: merged,
    },
    update: {
      activeIntentJson: merged,
      lastActivityAt: new Date(),
    },
  });
}

export async function getMemorySessionRow(userId: string, sessionId: string) {
  if (!intelligenceFlags.marketplaceMemoryEngineV1) return null;
  return prisma.userMemorySession.findUnique({
    where: { userId_sessionId: { userId, sessionId: sessionId.slice(0, 128) } },
  });
}
