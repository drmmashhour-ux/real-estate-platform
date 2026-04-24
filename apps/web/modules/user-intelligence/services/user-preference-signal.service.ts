import { prisma } from "@/lib/db";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import type { UserIntelligenceServiceResult, UserPreferenceSignalInput } from "../types/user-intelligence.types";
import { safeSignalValue } from "../utils/user-preference-normalize";

/**
 * Rejects non-product or unsafe keys (including protected-trait heuristics in names).
 */
function isKeyAllowed(k: string): boolean {
  const s = k.toLowerCase();
  if (s.length < 2 || s.length > 200) {
    return false;
  }
  if (s.includes("nation") || s.includes("ethnic") || s.includes("relig") || s.match(/\brace\b/) || s.includes("gender")) {
    return false;
  }
  if (!/^[a-z0-9_]+$/i.test(s)) {
    return false;
  }
  return true;
}

/**
 * Additive, auditable signal. Never throws.
 */
export async function recordSignal(
  input: UserPreferenceSignalInput,
): Promise<UserIntelligenceServiceResult<{ id: string }>> {
  try {
    if (!input.userId || !input.signalKey?.trim()) {
      return { ok: false, error: "missing_user_or_key" };
    }
    if (!isKeyAllowed(input.signalKey)) {
      return { ok: false, error: "signal_key_not_permitted" };
    }
    const v = safeSignalValue(input.signalValue);
    if (v == null) {
      return { ok: false, error: "empty_value" };
    }
    const row = await prisma.userPreferenceSignalW13.create({
      data: {
        userId: input.userId,
        profileId: input.profileId,
        sourceDomain: input.sourceDomain,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        signalKey: input.signalKey,
        signalValueJson: v as object,
        signalWeight: input.signalWeight,
        confidence: input.confidence,
        explicitUserProvided: input.explicitUserProvided ?? false,
        derivedFromBehavior: input.derivedFromBehavior ?? false,
        expiresAt: input.expiresAt,
        lastObservedAt: input.lastObservedAt ?? new Date(),
      },
      select: { id: true },
    });
    playbookLog.info("user_intelligence: signal", { id: row.id, key: input.signalKey, domain: input.sourceDomain });
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    playbookLog.warn("user_intelligence: recordSignal", { message: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "record_failed" };
  }
}

export async function listSignals(
  userId: string,
  take = 80,
): Promise<UserIntelligenceServiceResult<{
  id: string;
  signalKey: string;
  createdAt: Date;
  explicitUserProvided: boolean;
}[]>> {
  try {
    const rows = await prisma.userPreferenceSignal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        signalKey: true,
        createdAt: true,
        explicitUserProvided: true,
      },
    });
    return {
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        signalKey: r.signalKey,
        createdAt: r.createdAt,
        explicitUserProvided: r.explicitUserProvided,
      })),
    };
  } catch (e) {
    playlistDebug(e);
    return { ok: false, error: "list_failed" };
  }
}

function playlistDebug(e: unknown): void {
  playbookLog.warn("user_intelligence: listSignals", { message: e instanceof Error ? e.message : String(e) });
}
