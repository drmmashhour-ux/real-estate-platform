import { prisma } from "@/lib/db";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import type { Prisma } from "@prisma/client";
import type { UserIntelligenceServiceResult, UserPreferenceProfileView, UserProfileBuildInput } from "../types/user-intelligence.types";
import { applySessionOverStored, mergeSignalsToProfile } from "../utils/user-preference-merge";
import { normalizePreferenceRecord } from "../utils/user-preference-normalize";

/**
 * Get or create empty profile for user.
 */
export async function ensureUserPreferenceProfile(
  userId: string,
): Promise<UserIntelligenceServiceResult<{ id: string }>> {
  try {
    const r = await prisma.userPreferenceProfile.upsert({
      where: { userId },
      create: { userId, isActive: true },
      update: {},
      select: { id: true },
    });
    return { ok: true, data: { id: r.id } };
  } catch (e) {
    playbookLog.warn("user_intelligence: ensureUserPreferenceProfile", { message: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "ensure_failed" };
  }
}

/**
 * Rebuilds derived JSON fields from `UserPreferenceSignal` rows. Never throws.
 */
export async function rebuildProfile(
  userId: string,
  _input?: UserProfileBuildInput,
): Promise<UserIntelligenceServiceResult<UserPreferenceProfileView>> {
  try {
    const p = await prisma.userPreferenceProfile.upsert({
      where: { userId },
      create: { userId, isActive: true },
      update: {},
    });
    const rows = await prisma.userPreferenceSignal.findMany({
      where: { userId, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const merged = mergeSignalsToProfile(rows, {});
    if (_input?.sessionExplicitOverride) {
      merged.housingPreferences = applySessionOverStored(
        _input.sessionExplicitOverride as Record<string, unknown>,
        merged.housingPreferences,
      ) as UserPreferenceProfileView["categories"]["housing"] | null;
    }
    const u = await prisma.userPreferenceProfile.update({
      where: { id: p.id },
      data: {
        householdProfile: toJson(merged.householdProfile),
        housingPreferences: toJson(merged.housingPreferences),
        lifestylePreferences: toJson(merged.lifestylePreferences),
        neighborhoodPreferences: toJson(merged.neighborhoodPreferences),
        budgetPreferences: toJson(merged.budgetPreferences),
        accessibilityPreferences: toJson(merged.accessibilityPreferences),
        designPreferences: toJson(merged.designPreferences),
        confidenceScore: merged.confidence,
        lastInferredAt: new Date(),
        lastInteractionAt: new Date(),
      },
    });
    return { ok: true, data: mapProfileToView(u, rows.length) };
  } catch (e) {
    playbookLog.warn("user_intelligence: rebuildProfile", { message: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "rebuild_failed" };
  }
}

/**
 * Get active profile. Never throws.
 */
export async function getProfile(
  userId: string,
): Promise<UserIntelligenceServiceResult<UserPreferenceProfileView | null>> {
  try {
    const u = await prisma.userPreferenceProfile.findUnique({ where: { userId } });
    if (!u) {
      return { ok: true, data: null };
    }
    const n = await prisma.userPreferenceSignal.count({ where: { userId } });
    return { ok: true, data: mapProfileToView(u, n) };
  } catch (e) {
    playbookLog.warn("user_intelligence: getProfile", { message: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "get_failed" };
  }
}

export async function createSnapshot(
  userId: string,
  source: string,
  type = "rebuild",
): Promise<UserIntelligenceServiceResult<{ id: string }>> {
  try {
    const p = await prisma.userPreferenceProfile.findUnique({ where: { userId } });
    if (!p) {
      return { ok: false, error: "no_profile" };
    }
    const body = {
      profile: p,
    };
    const s = await prisma.userPreferenceSnapshot.create({
      data: {
        userId,
        profileId: p.id,
        snapshotType: type,
        profileJson: toJson(body) as Prisma.InputJsonValue,
        source,
        summary: "Wave 13 preference snapshot",
      },
    });
    await prisma.userPreferenceProfile.update({
      where: { id: p.id },
      data: { activeSnapshotId: s.id },
    });
    return { ok: true, data: { id: s.id } };
  } catch (e) {
    playbookLog.warn("user_intelligence: createSnapshot", { message: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "snapshot_failed" };
  }
}

function toJson(v: Record<string, unknown> | null | undefined): Prisma.InputJsonValue {
  if (v == null) {
    return null as unknown as Prisma.InputJsonValue;
  }
  return v as Prisma.InputJsonValue;
}

function asObj(j: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (j == null) {
    return null;
  }
  if (typeof j === "object" && !Array.isArray(j)) {
    return j as Record<string, unknown>;
  }
  return null;
}

function mapProfileToView(
  u: { id: string; userId: string; confidenceScore: number | null; lastInferredAt: Date | null; lastInteractionAt: Date | null; isActive: boolean; householdProfile: Prisma.JsonValue; housingPreferences: Prisma.JsonValue; lifestylePreferences: Prisma.JsonValue; neighborhoodPreferences: Prisma.JsonValue; budgetPreferences: Prisma.JsonValue; accessibilityPreferences: Prisma.JsonValue; designPreferences: Prisma.JsonValue },
  nSources: number,
): UserPreferenceProfileView {
  return {
    id: u.id,
    userId: u.userId,
    confidenceScore: u.confidenceScore,
    lastRebuiltAt: u.lastInferredAt?.toISOString() ?? null,
    lastInteractionAt: u.lastInteractionAt?.toISOString() ?? null,
    isActive: u.isActive,
    categories: {
      household: normalizePreferenceRecord(asObj(u.householdProfile)),
      housing: asObj(u.housingPreferences) ? normalizePreferenceRecord(asObj(u.housingPreferences)!) : null,
      lifestyle: asObj(u.lifestylePreferences) ? normalizePreferenceRecord(asObj(u.lifestylePreferences)!) : null,
      neighborhood: asObj(u.neighborhoodPreferences) ? normalizePreferenceRecord(asObj(u.neighborhoodPreferences)!) : null,
      budget: asObj(u.budgetPreferences) ? normalizePreferenceRecord(asObj(u.budgetPreferences)!) : null,
      accessibility: asObj(u.accessibilityPreferences) ? normalizePreferenceRecord(asObj(u.accessibilityPreferences)!) : null,
      design: asObj(u.designPreferences) ? normalizePreferenceRecord(asObj(u.designPreferences)!) : null,
    },
    sourceSignalCount: nSources,
  };
}
