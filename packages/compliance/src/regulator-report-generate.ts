import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildBundleNumber } from "@/lib/compliance/audit";
import { REGULATOR_EXPORT_PROFILES, REGULATOR_FULL_REPORT_SECTIONS, type RegulatorReportSectionKey } from "@/lib/compliance/regulator-exports";

export type RegulatorReportManifest = {
  sections: Record<string, { count: number; note?: string }>;
  exportProfiles: typeof REGULATOR_EXPORT_PROFILES;
  generatedAt: string;
};

async function sectionCounts(
  ownerType: string,
  ownerId: string,
  dateFrom: Date | null,
  dateTo: Date | null,
): Promise<Record<RegulatorReportSectionKey, number>> {
  const auditWhere: Prisma.ComplianceAuditRecordWhereInput = { ownerType, ownerId };
  if (dateFrom && dateTo && !Number.isNaN(dateFrom.getTime()) && !Number.isNaN(dateTo.getTime())) {
    auditWhere.eventTimestamp = { gte: dateFrom, lte: dateTo };
  } else if (dateFrom && !Number.isNaN(dateFrom.getTime())) {
    auditWhere.eventTimestamp = { gte: dateFrom };
  } else if (dateTo && !Number.isNaN(dateTo.getTime())) {
    auditWhere.eventTimestamp = { lte: dateTo };
  }

  const listings =
    ownerType === "platform"
      ? []
      : await prisma.listing.findMany({
          where:
            ownerType === "solo_broker"
              ? { ownerId }
              : { tenantId: ownerId },
          select: { id: true },
          take: 8000,
        });
  const listingIds = listings.map((l) => l.id);

  const [
    audit,
    complaints,
    trust,
    financial,
    contracts,
    declarations,
    risk,
  ] = await Promise.all([
    prisma.complianceAuditRecord.count({ where: auditWhere }),
    prisma.complaintCase.count({ where: { ownerType, ownerId } }),
    ownerType === "solo_broker"
      ? prisma.trustDeposit.count({ where: { brokerId: ownerId } })
      : ownerType === "agency"
        ? prisma.trustDeposit.count({ where: { agencyId: ownerId } })
        : Promise.resolve(0),
    prisma.complianceAuditRecord.count({
      where: {
        ...auditWhere,
        moduleKey: "financial",
      },
    }),
    prisma.complianceAuditRecord.count({
      where: {
        ...auditWhere,
        moduleKey: { in: ["contracts", "forms"] },
      },
    }),
    listingIds.length
      ? prisma.sellerDeclaration.count({
          where: { listingId: { in: listingIds } },
        })
      : Promise.resolve(0),
    prisma.complianceRiskEvent.count({ where: { ownerType, ownerId } }),
  ]);

  return {
    audit,
    complaints,
    trust,
    financial,
    contracts,
    declarations,
    risk,
  };
}

export async function createRegulatorReportBundle(input: {
  ownerType: string;
  ownerId: string;
  generatedById: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  notes?: string | null;
}) {
  const dateFrom = input.dateFrom && !Number.isNaN(input.dateFrom.getTime()) ? input.dateFrom : null;
  const dateTo = input.dateTo && !Number.isNaN(input.dateTo.getTime()) ? input.dateTo : null;

  const counts = await sectionCounts(input.ownerType, input.ownerId, dateFrom, dateTo);

  const sections: RegulatorReportManifest["sections"] = {};
  for (const key of REGULATOR_FULL_REPORT_SECTIONS) {
    sections[key] = { count: counts[key] };
  }

  const manifest: RegulatorReportManifest = {
    sections,
    exportProfiles: REGULATOR_EXPORT_PROFILES,
    generatedAt: new Date().toISOString(),
  };

  const bundle = await prisma.complianceExportBundle.create({
    data: {
      bundleNumber: buildBundleNumber(),
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      bundleType: "regulator_full_report",
      status: "generated",
      dateFrom,
      dateTo,
      generatedById: input.generatedById,
      generatedAt: new Date(),
      manifest: {
        ...manifest,
        notes: input.notes ?? null,
        sectionKeys: REGULATOR_FULL_REPORT_SECTIONS,
      },
    },
  });

  return bundle;
}
