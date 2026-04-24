import { mergePlaybookContextWithUserIntelligence } from "@/modules/user-intelligence/services/user-personalization.service";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import type { RecommendationRequestContext } from "@/modules/playbook-memory/types/playbook-memory.types";
import { getDomainModule } from "./shared/domain-registry";

type Signals = Record<string, string | number | boolean | null | undefined>;

function mergeSignals(base: unknown, extra: unknown): Signals {
  const out: Signals = {};
  if (base && typeof base === "object" && !Array.isArray(base)) {
    Object.assign(out, base as Signals);
  }
  if (extra && typeof extra === "object" && !Array.isArray(extra)) {
    for (const [k, v] of Object.entries(extra as Record<string, unknown>)) {
      if (v === undefined) {
        continue;
      }
      if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        out[k] = v;
      }
    }
  }
  return out;
}

/**
 * Merges `domainModule.buildContext` into `signals` for scoring / fit (no throws).
 */
export async function augmentRecommendationContext(
  context: RecommendationRequestContext,
): Promise<RecommendationRequestContext> {
  try {
    const withUser = await mergePlaybookContextWithUserIntelligence(context);
    const mod = getDomainModule(String(withUser.domain));
    if (!mod) {
      return withUser;
    }
    const extra = await mod.buildContext(withUser);
    if (extra == null) {
      return withUser;
    }
    const nextSignals = mergeSignals(withUser.signals, extra);
    if (Object.keys(nextSignals).length === 0) {
      return withUser;
    }
    return { ...withUser, signals: nextSignals as RecommendationRequestContext["signals"] };
  } catch (e) {
    playbookLog.warn("augmentRecommendationContext", {
      domain: context.domain,
      message: e instanceof Error ? e.message : String(e),
    });
    return context;
  }
}
