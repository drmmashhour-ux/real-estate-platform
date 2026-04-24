import { prisma } from "@/lib/db";
import { logEmpire } from "./empire-logger";
import { CapitalSummary } from "./empire.types";

const TAG = "[empire-capital]";

/**
 * Track:
 * - capital by entity
 * - reserves
 * - operating allocation
 * - investment allocation
 * - inter-entity funding notes
 */

export async function getCapitalByEntity(entityId: string): Promise<CapitalSummary | null> {
  // @ts-ignore - EmpireEntity may not be in generated client yet
  const entity = await prisma.empireEntity.findUnique({
    where: { id: entityId },
    select: { id: true, name: true },
  });

  if (!entity) return null;

  // Aggregate from linked fund allocations and bank balances
  // Heuristic: placeholder for multi-company financial layer
  return {
    entityId: entity.id,
    entityName: entity.name,
    totalCapital: 1500000,
    reserves: 300000,
    operatingAllocation: 700000,
    investmentAllocation: 500000,
    currency: "CAD",
  };
}

export async function summarizeCapitalBuckets(): Promise<CapitalSummary[]> {
  // @ts-ignore
  const entities = await prisma.empireEntity.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const results = await Promise.all(entities.map((e: any) => getCapitalByEntity(e.id)));
  return results.filter((r): r is CapitalSummary => r !== null);
}

export async function suggestCapitalAllocationAcrossEntities() {
  const summaries = await summarizeCapitalBuckets();
  
  // Rules:
  // - Large capital redeployment requires review
  // - One entity cannot silently absorb another's capital pool
  
  const suggestions = summaries
    .map((s) => {
      if (s.reserves > s.totalCapital * 0.4) {
        return {
          entityId: s.entityId,
          entityName: s.entityName,
          action: "REDEPLOY_SURPLUS",
          amount: s.reserves * 0.4,
          rationale: "Entity has high cash reserves (>40%). Suggesting redeployment to growth-starved subsidiaries.",
        };
      }
      return null;
    })
    .filter(Boolean);

  logEmpire("capital_summary_generated", { entityCount: summaries.length });
  return suggestions;
}
