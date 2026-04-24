import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { getEligibleRecommendationCandidates } from "@/modules/playbook-memory/services/playbook-memory-recommendation.service";
import { playbookMemoryAssignmentService } from "@/modules/playbook-memory/services/playbook-memory-assignment.service";
import type { PlaybookAssignmentResult, PlaybookBanditContext, PlaybookRecommendation } from "@/modules/playbook-memory/types/playbook-memory.types";
import { buildDreamHomeContext } from "@/modules/playbook-domains/dream-home/dream-home-context.builder";

/**
 * Domain-appropriate Dream Home playbooks. Never throws.
 */
export async function getDreamHomePlaybookRecommendations(input: {
  segment?: Record<string, unknown>;
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
      },
      24,
    );
    if (!res) {
      return [];
    }
    playbookLog.info("dream home playbooks", { n: res.length });
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
    };
    return await playbookMemoryAssignmentService.assignBestPlaybook(c);
  } catch (e) {
    playbookLog.warn("dream home assign failed", { message: e instanceof Error ? e.message : String(e) });
    return null;
  }
}
