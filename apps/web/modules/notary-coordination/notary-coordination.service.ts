import { CoordinationContactType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logCoordinationAudit } from "@/lib/deals/coordination-audit";
import { defaultNotaryPackageChecklist } from "./notary-package.service";
import { deedReadinessScore } from "./deed-readiness.service";
import type { NotaryPackageItem } from "./notary-coordination.types";

export async function getNotaryCoordination(dealId: string) {
  const [row, contacts] = await Promise.all([
    prisma.dealNotaryCoordination.findUnique({ where: { dealId } }),
    prisma.coordinationContact.findMany({
      where: { dealId, contactType: "NOTARY" },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const checklist = (row?.packageChecklistJson as unknown as NotaryPackageItem[] | undefined) ?? defaultNotaryPackageChecklist();
  const readiness = deedReadinessScore(checklist);
  return {
    coordination: row,
    notaryContacts: contacts,
    checklist,
    readinessScore: readiness,
  };
}

export async function upsertNotaryPackageChecklist(dealId: string, checklist: NotaryPackageItem[], actorUserId: string) {
  const row = await prisma.dealNotaryCoordination.upsert({
    where: { dealId },
    create: {
      dealId,
      packageChecklistJson: checklist as unknown as Prisma.InputJsonValue,
      packageStatus: "in_progress",
    },
    update: {
      packageChecklistJson: checklist as unknown as Prisma.InputJsonValue,
      packageStatus: "in_progress",
    },
  });
  await logCoordinationAudit({
    dealId,
    action: "notary_package_updated",
    actorUserId,
    entityType: "DealNotaryCoordination",
    entityId: row.id,
    payload: { readiness: deedReadinessScore(checklist) },
  });
  return row;
}

export async function registerNotaryContact(
  dealId: string,
  input: { name: string; email?: string; phone?: string; organization?: string; region?: string },
  actorUserId: string
) {
  const row = await prisma.coordinationContact.create({
    data: {
      dealId,
      contactType: CoordinationContactType.NOTARY,
      name: input.name,
      email: input.email,
      phone: input.phone,
      organization: input.organization,
      region: input.region,
    },
  });
  await logCoordinationAudit({
    dealId,
    action: "contact_registered",
    actorUserId,
    entityType: "CoordinationContact",
    entityId: row.id,
    payload: { contactType: "NOTARY" },
  });
  return row;
}

export async function patchNotaryCoordination(
  dealId: string,
  input: { packageStatus?: string; deedReadinessNotes?: string | null; notaryFirmName?: string | null; metadata?: Record<string, unknown> },
  actorUserId: string
) {
  const row = await prisma.dealNotaryCoordination.upsert({
    where: { dealId },
    create: {
      dealId,
      packageStatus: input.packageStatus ?? "not_started",
      deedReadinessNotes: input.deedReadinessNotes ?? undefined,
      notaryFirmName: input.notaryFirmName ?? undefined,
      metadata: (input.metadata ?? {}) as object,
    },
    update: {
      packageStatus: input.packageStatus ?? undefined,
      deedReadinessNotes: input.deedReadinessNotes ?? undefined,
      notaryFirmName: input.notaryFirmName ?? undefined,
      metadata: input.metadata !== undefined ? (input.metadata as object) : undefined,
    },
  });
  await logCoordinationAudit({
    dealId,
    action: "notary_package_updated",
    actorUserId,
    entityType: "DealNotaryCoordination",
    entityId: row.id,
    payload: { packageStatus: row.packageStatus },
  });
  return row;
}
