import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateExportNumber } from "@/lib/compliance/export-number";
import { logComplianceModuleAudit } from "@/lib/compliance/compliance-module-audit";

export async function buildRegulatorExport(input: {
  ownerType: string;
  ownerId: string;
  exportType: string;
  scopeType: string;
  scopeId?: string | null;
  requestedById?: string | null;
  actorUserId?: string | null;
}) {
  const auditWhere: Prisma.ComplianceAuditLogWhereInput = {};
  if (input.scopeType === "listing" && input.scopeId) {
    auditWhere.complianceCase = { listingId: input.scopeId };
  }
  if (input.scopeType === "complaint" && input.scopeId) {
    auditWhere.complianceCase = { id: input.scopeId };
  }

  const audit = await prisma.complianceAuditLog.findMany({
    where: Object.keys(auditWhere).length ? auditWhere : undefined,
    orderBy: { createdAt: "asc" },
    take: 5000,
    include: { complianceCase: true },
  });

  const caseWhere: Prisma.ComplianceCaseWhereInput = {};
  if (input.scopeType === "listing" && input.scopeId) {
    caseWhere.listingId = input.scopeId;
  }
  if (input.scopeType === "complaint" && input.scopeId) {
    caseWhere.id = input.scopeId;
  }

  const complianceCases = await prisma.complianceCase.findMany({
    where: Object.keys(caseWhere).length ? caseWhere : undefined,
    take: 2000,
  });

  const trustWhere: Prisma.TrustDepositWhereInput = {};
  if (input.ownerType === "agency") {
    trustWhere.agencyId = input.ownerId;
  } else if (input.ownerType === "solo_broker") {
    trustWhere.brokerId = input.ownerId;
  }
  if (input.scopeType === "listing" && input.scopeId) {
    trustWhere.listingId = input.scopeId;
  }

  const trustDeposits =
    input.ownerType === "agency" || input.ownerType === "solo_broker"
      ? await prisma.trustDeposit.findMany({
          where: trustWhere,
          take: 2000,
        })
      : [];

  const receipts = await prisma.cashReceiptForm.findMany({
    where: { ownerType: input.ownerType, ownerId: input.ownerId },
    take: 3000,
  });

  const report = {
    exportType: input.exportType,
    scopeType: input.scopeType,
    scopeId: input.scopeId ?? null,
    generatedAt: new Date().toISOString(),
    dataNotes: {
      auditSource: "compliance_audit_logs",
      complaintsSource: "compliance_cases",
      trustSource: "trust_deposits",
      receiptsSource: "cash_receipt_forms",
    },
    counts: {
      audit: audit.length,
      complaints: complianceCases.length,
      trustDeposits: trustDeposits.length,
      receipts: receipts.length,
    },
    audit,
    complaints: complianceCases,
    trustDeposits,
    receipts,
  };

  const run = await prisma.regulatorExportRun.create({
    data: {
      exportNumber: generateExportNumber(input.exportType),
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      exportType: input.exportType,
      scopeType: input.scopeType,
      scopeId: input.scopeId ?? null,
      status: "generated",
      format: "json",
      requestedById: input.requestedById ?? null,
      generatedAt: new Date(),
      manifest: report as object,
    },
  });

  await logComplianceModuleAudit({
    actorUserId: input.actorUserId ?? input.requestedById,
    action: "regulator_export_generated",
    payload: {
      entityId: run.id,
      exportNumber: run.exportNumber,
      exportType: run.exportType,
      scopeType: run.scopeType,
    },
  });

  return run;
}

export async function sealRegulatorExportRun(input: {
  runId: string;
  fileUrl?: string | null;
  actorUserId?: string | null;
}) {
  const run = await prisma.regulatorExportRun.update({
    where: { id: input.runId },
    data: {
      status: "sealed",
      sealedAt: new Date(),
      fileUrl: input.fileUrl ?? undefined,
    },
  });

  await logComplianceModuleAudit({
    actorUserId: input.actorUserId,
    action: "regulator_export_sealed",
    payload: { entityId: run.id, exportNumber: run.exportNumber },
  });

  return run;
}
