import { prisma } from "@/lib/db";
import { brokerResidentialFlags } from "@/config/feature-flags";
import type { ResidentialClauseSourceRef } from "./residential-knowledge.types";

export async function listActiveClauseRefsForBroker(opts?: { jurisdiction?: string; take?: number }): Promise<ResidentialClauseSourceRef[]> {
  if (!brokerResidentialFlags.residentialKnowledgeHooksV1) return [];
  const rows = await prisma.clauseTemplate.findMany({
    where: {
      active: true,
      jurisdiction: opts?.jurisdiction ?? "QC",
    },
    select: {
      id: true,
      title: true,
      category: true,
      sourceReference: true,
      active: true,
    },
    orderBy: { updatedAt: "desc" },
    take: opts?.take ?? 24,
  });
  return rows.map((r) => ({
    clauseTemplateId: r.id,
    title: r.title,
    category: r.category,
    sourceReference: r.sourceReference,
    active: r.active,
  }));
}
