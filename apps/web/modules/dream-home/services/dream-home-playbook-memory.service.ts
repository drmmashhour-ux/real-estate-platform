import { buildDreamHomeContext } from "@/modules/playbook-domains/dream-home/dream-home-context.builder";
import { playbookMemoryWriteService } from "@/modules/playbook-memory";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import type { PlaybookComparableContext, RecordDecisionInput } from "@/modules/playbook-memory/types/playbook-memory.types";

type DreamHomeMemoryAction =
  | "dream_home_generate_profile"
  | "dream_home_generate_filters"
  | "dream_home_rank_listings"
  | "dream_home_recommend_playbook";

function toSignals(
  raw: Record<string, string | number | boolean | null>,
): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined) {
      continue;
    }
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Non-blocking playbook memory log. Never throws.
 */
export async function logDreamHomeMemory(p: {
  actionType: DreamHomeMemoryAction;
  triggerEvent: string;
  context: PlaybookComparableContext;
  actionPayload: Record<string, unknown>;
  idempotencyKey?: string;
}): Promise<void> {
  try {
    const input: RecordDecisionInput = {
      source: "SYSTEM",
      triggerEvent: p.triggerEvent,
      actionType: p.actionType,
      context: p.context,
      actionPayload: p.actionPayload,
      idempotencyKey: p.idempotencyKey,
    };
    await playbookMemoryWriteService.recordDecision(input);
    playbookLog.info("dream home memory", { actionType: p.actionType, trigger: p.triggerEvent });
  } catch (e) {
    playbookLog.warn("dream home memory skipped", {
      actionType: p.actionType,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function logDreamHomeProfileGenerated(payload: {
  questionnaire: unknown;
  source: "ai" | "deterministic";
}): Promise<void> {
  const flat = await buildDreamHomeContext({ segment: payload.questionnaire as Record<string, unknown> });
  const signals = toSignals(flat);
  const city = signals.city != null ? String(signals.city) : null;
  const ctx: PlaybookComparableContext = {
    domain: "DREAM_HOME",
    entityType: "dream_home_session",
    market: city ? { city } : undefined,
    segment: { source: "dream_home" },
    signals,
  };
  await logDreamHomeMemory({
    actionType: "dream_home_generate_profile",
    triggerEvent: "dream_home.profile.generated",
    context: ctx,
    actionPayload: { source: payload.source, fieldCount: Object.keys(signals).length },
  });
}

export async function logDreamHomeRankListings(payload: {
  listingIds: string[];
  topN: number;
}): Promise<void> {
  const ctx: PlaybookComparableContext = {
    domain: "DREAM_HOME",
    entityType: "dream_home_session",
    segment: { source: "dream_home" },
    signals: { topN: payload.topN, sampleCount: payload.listingIds.length },
  };
  await logDreamHomeMemory({
    actionType: "dream_home_rank_listings",
    triggerEvent: "dream_home.listings.ranked",
    context: ctx,
    actionPayload: { listingIds: payload.listingIds.slice(0, 48) },
  });
}

export async function logDreamHomeRecommendPlaybook(payload: { playbookId: string; reason: string }): Promise<void> {
  const ctx: PlaybookComparableContext = {
    domain: "DREAM_HOME",
    entityType: "dream_home_session",
    segment: { source: "dream_home" },
  };
  await logDreamHomeMemory({
    actionType: "dream_home_recommend_playbook",
    triggerEvent: "dream_home.playbook.recommended",
    context: ctx,
    actionPayload: { playbookId: payload.playbookId, reason: payload.reason },
  });
}
