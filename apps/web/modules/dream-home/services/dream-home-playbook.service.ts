import { dreamHomeLearningLog } from "@/modules/playbook-memory/playbook-learning-logger";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { getEligibleRecommendationCandidates } from "@/modules/playbook-memory/services/playbook-memory-recommendation.service";
import { playbookMemoryAssignmentService } from "@/modules/playbook-memory/services/playbook-memory-assignment.service";
import type { PlaybookAssignmentResult, PlaybookBanditContext, PlaybookRecommendation } from "@/modules/playbook-memory/types/playbook-memory.types";
import { buildDreamHomeContext } from "@/modules/playbook-domains/dream-home/dream-home-context.builder";
import { getDomainModule } from "@/modules/playbook-domains/shared/domain-registry";
import { evaluateCrossDomainTransfer } from "@/modules/playbook-domains/shared/cross-domain-policy";

/**
 * Domain-appropriate Dream Home playbooks. Never throws.
 */
export async function getDreamHomePlaybookRecommendations(input: {
  segment?: Record<string, unknown>;
  /** When set, merges Wave 13 personalization into recommendation signals (additive). */
  userId?: string | null;
}): Promise<PlaybookRecommendation[]> {
  try {
    const flat = await buildDreamHomeContext({ segment: input.segment ?? {} });
    const res = await getEligibleRecommendationCandidates(
      {
        domain: "DREAM_HOME",
        entityType: "dream_home_wizard",
        market: { city: flat.city != null ? String(flat.city) : undefined },
        segment: input.segment ?? { source: "dream_home" },
        signals: flat,
        userId: input.userId?.trim() || undefined,
      },
      24,
    );
    if (!res) {
      return [];
    }
    playbookLog.info("dream home playbooks", { n: res.length });
    try {
      const mod = getDomainModule("DREAM_HOME");
      dreamHomeLearningLog.info("recommendations_ready", { n: res.length, moduleLoaded: Boolean(mod) });
    } catch {
      dreamHomeLearningLog.info("recommendations_ready", { n: res.length, moduleLoaded: false });
    }
    return res;
  } catch (e) {
    playbookLog.warn("dream home playbooks failed", { message: e instanceof Error ? e.message : String(e) });
    return [];
  }
}

/**
 * Suggest bandit-based assignment; does not auto-execute. Never throws.
 */
export async function suggestDreamHomePlaybookAssignment(ctx: {
  entityId?: string;
  segment: Record<string, unknown>;
  userId?: string | null;
}): Promise<PlaybookAssignmentResult | null> {
  try {
    const flat = await buildDreamHomeContext({ segment: ctx.segment });
    const c: PlaybookBanditContext = {
      domain: "DREAM_HOME",
      entityType: "dream_home_wizard",
      entityId: ctx.entityId,
      market: { city: flat.city != null ? String(flat.city) : undefined },
      segment: ctx.segment,
      signals: flat,
      userId: ctx.userId?.trim() || undefined,
    };
    const assignment = await playbookMemoryAssignmentService.assignBestOrManualFallback(c);
    try {
      const cd = evaluateCrossDomainTransfer("DREAM_HOME", "LISTINGS");
      dreamHomeLearningLog.info("assignment_context", {
        hasAssignment: Boolean(assignment?.assignmentId),
        crossDomainToListings: cd.allowed,
        rationale: cd.rationale,
      });
    } catch {
      /* */
    }
    return assignment;
  } catch (e) {
    playbookLog.warn("dream home assign failed", { message: e instanceof Error ? e.message : String(e) });
    return null;
  }
}
