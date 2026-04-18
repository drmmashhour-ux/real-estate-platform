import { prisma } from "@/lib/db";

export async function listActiveClauseTemplates(jurisdiction = "QC", take = 40) {
  return prisma.clauseTemplate.findMany({
    where: { active: true, jurisdiction },
    orderBy: { updatedAt: "desc" },
    take,
  });
}
