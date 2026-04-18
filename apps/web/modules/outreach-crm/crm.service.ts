import { prisma } from "@/lib/db";
import { isValidPipelineTransition } from "@/modules/host-acquisition/acquisition-pipeline.service";

export async function listOutreachLeads(take = 200) {
  return prisma.outreachLead.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { createdBy: { select: { id: true, email: true, name: true } } },
  });
}

export async function createOutreachLead(input: {
  contact: string;
  type: string;
  source: string;
  status?: string;
  name?: string | null;
  notes?: string | null;
  market?: string | null;
  createdByUserId?: string | null;
}) {
  return prisma.outreachLead.create({
    data: {
      contact: input.contact.trim(),
      type: input.type,
      source: input.source,
      status: input.status ?? "identified",
      name: input.name?.trim() || null,
      notes: input.notes?.trim() || null,
      market: input.market?.trim() || null,
      createdByUserId: input.createdByUserId ?? undefined,
    },
  });
}

export async function updateOutreachLeadStatus(id: string, toStatus: string) {
  const current = await prisma.outreachLead.findUnique({ where: { id } });
  if (!current) return { error: "not_found" as const };
  if (!isValidPipelineTransition(current.status, toStatus)) {
    return { error: "invalid_transition" as const, from: current.status, to: toStatus };
  }
  const row = await prisma.outreachLead.update({
    where: { id },
    data: { status: toStatus },
  });
  return { ok: true as const, row };
}
