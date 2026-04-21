import { prisma } from "@/lib/db";
import type { AgentOutput, ConflictResolutionResult } from "./executive.types";
import { executiveLog } from "./executive-log";

/**
 * Conservative conflict detection: compliance/legal stress vs growth upside (Part 8).
 */
export async function resolveCrossAgentConflicts(params: {
  entityType: string;
  entityId: string;
  outputs: AgentOutput[];
}): Promise<{ resolutions: ConflictResolutionResult[]; conflictIds: string[] }> {
  const legal = params.outputs.find((o) => o.agentName === "LEGAL_COMPLIANCE");
  const growth = params.outputs.find((o) => o.agentName === "GROWTH");
  const conflictIds: string[] = [];
  const resolutions: ConflictResolutionResult[] = [];

  if (legal?.requiresEscalation && growth?.opportunities?.length) {
    const row = await prisma.executiveConflict.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        agentA: "LEGAL_COMPLIANCE",
        agentB: "GROWTH",
        conflictType: "PRIORITY",
        summary: "Compliance/legal stress present while growth suggests market acceleration — prioritize disclosure readiness.",
        resolutionStatus: "RESOLVED",
        resolutionJson: {
          preferredRecommendation: "Hold growth acceleration until compliance blockers materially clear.",
          rationale: "Policy: compliance/legal blockers generally outrank growth positioning.",
        } as object,
      },
    });
    conflictIds.push(row.id);
    resolutions.push({
      resolutionType: "RESOLVED",
      preferredRecommendation: "Defer growth pushes; clear compliance tasks first.",
      rationale: row.summary,
      affectedTasks: [],
    });
    executiveLog.conflict("detected_priority", { conflictId: row.id });
    return { resolutions, conflictIds };
  }

  return { resolutions: [], conflictIds: [] };
}
