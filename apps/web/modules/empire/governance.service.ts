import { prisma } from "@/lib/db";
import { GovernanceAlert } from "./empire.types";
import { logEmpire } from "./empire-logger";

const TAG = "[empire-governance]";

/**
 * Track:
 * - approval thresholds
 * - reserved decisions
 * - cross-company dependency risks
 * - key-person risk
 * - concentration risk
 */
export async function checkEmpireGovernance() {
  const alerts: GovernanceAlert[] = [];

  // @ts-ignore
  const entities = await prisma.empireEntity.findMany({
    where: { isActive: true },
    include: { roles: true },
  });

  for (const entity of entities) {
    // Check key-person risk (no FOUNDER or MANAGER assigned)
    const criticalRoles = entity.roles.filter((r: any) => 
      r.roleType === "FOUNDER" || r.roleType === "MANAGER"
    );
    if (criticalRoles.length === 0) {
      alerts.push({
        id: `risk-kp-${entity.id}`,
        entityId: entity.id,
        entityName: entity.name,
        severity: "HIGH",
        type: "KEY_PERSON_RISK",
        message: "No assigned Founder or Manager. Operational control is ambiguous.",
        createdAt: new Date(),
      });
    }

    // Heuristic: Check for concentration risk (e.g. parent entity owning >90% of children)
    // In a real system, we'd check ownership concentration metrics.
  }

  // Large capital redeployment check would be here
  
  if (alerts.length > 0) {
    logEmpire("governance_alert_generated", { alertCount: alerts.length });
  }

  return { alerts };
}
