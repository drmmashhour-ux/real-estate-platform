import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/get-session";
import { assertComplianceOwnerAccess } from "@/lib/compliance/compliance-access";
import { buildReportManifest, buildReportRunNumber, summarizeReportCounts } from "@/lib/compliance/reporting";
import {
  assertLegalHoldRecordsNotOmitted,
  assertReportScopeAndType,
} from "@/lib/compliance/reporting-guards";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { createAccountabilityRecord } from "@/lib/compliance/create-accountability-record";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const ownerType = typeof body.ownerType === "string" ? body.ownerType.trim() : "";
  const ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";
  const reportKey = typeof body.reportKey === "string" ? body.reportKey.trim() : "";
  const reportType = typeof body.reportType === "string" ? body.reportType.trim() : "";
  const scopeType = typeof body.scopeType === "string" ? body.scopeType.trim() : "";
  const scopeId = typeof body.scopeId === "string" ? body.scopeId.trim() : "";
  const dateFromRaw = typeof body.dateFrom === "string" ? body.dateFrom : null;
  const dateToRaw = typeof body.dateTo === "string" ? body.dateTo : null;
  const format = typeof body.format === "string" ? body.format.trim() : "json";
  const generatedBySystem = body.generatedBySystem === true;
  const reportDefinitionId =
    typeof body.reportDefinitionId === "string" && body.reportDefinitionId.trim()
      ? body.reportDefinitionId.trim()
      : null;
  const modules = Array.isArray(body.modules) ? body.modules.map((m) => String(m)) : [];
  const omitLegalHoldRecords = body.omitLegalHoldRecords === true;
  const requestedByActorId =
    typeof body.requestedByActorId === "string" && body.requestedByActorId.trim()
      ? body.requestedByActorId.trim()
      : user.id;

  if (user.role === PlatformRole.BROKER && requestedByActorId !== user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (ownerType === "platform" && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    assertReportScopeAndType({ reportKey, reportType, scopeType });
    assertLegalHoldRecordsNotOmitted(omitLegalHoldRecords);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INVALID_REQUEST";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  if (!ownerType || !ownerId) {
    return NextResponse.json({ success: false, error: "OWNER_REQUIRED" }, { status: 400 });
  }

  const access = await assertComplianceOwnerAccess(user, ownerType, ownerId);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.message }, { status: 403 });
  }

  const auditWhere: Prisma.ComplianceAuditRecordWhereInput = {
    ownerType,
    ownerId,
  };
  if (scopeType === "listing" && scopeId) {
    auditWhere.linkedListingId = scopeId;
  }
  if (scopeType === "date_range") {
    const ts: Prisma.DateTimeFilter = {};
    if (dateFromRaw) ts.gte = new Date(dateFromRaw);
    if (dateToRaw) ts.lte = new Date(dateToRaw);
    if (Object.keys(ts).length > 0) {
      auditWhere.eventTimestamp = ts;
    }
  }

  const complaintWhere: Prisma.ComplaintCaseWhereInput = {
    ownerType,
    ownerId,
    ...(scopeType === "complaint" && scopeId ? { id: scopeId } : {}),
    ...(scopeType === "listing" && scopeId ? { linkedListingId: scopeId } : {}),
  };

  const trustWhere: Prisma.TrustDepositWhereInput = {};
  if (ownerType === "agency") trustWhere.agencyId = ownerId;
  else if (ownerType === "solo_broker") trustWhere.brokerId = ownerId;
  if (scopeType === "trust" && scopeId) trustWhere.id = scopeId;
  if (scopeType === "listing" && scopeId) trustWhere.listingId = scopeId;
  const trustScoped =
    ownerType === "agency" ||
    ownerType === "solo_broker" ||
    (scopeType === "trust" && !!scopeId) ||
    (scopeType === "listing" && !!scopeId);
  if (ownerType === "platform" && !trustScoped) {
    trustWhere.id = "__no_trust_scope__";
  }

  const financialWhere: Prisma.CashReceiptFormWhereInput = {
    ownerType,
    ownerId,
  };

  const declarationWhere: Prisma.SellerDeclarationWhereInput =
    scopeType === "listing" && scopeId ? { listingId: scopeId } : { id: "__no_declaration_scope__" };

  const contractWhere: Prisma.ContractWhereInput = {};
  if (scopeType === "listing" && scopeId) {
    contractWhere.OR = [{ listingId: scopeId }, { fsboListingId: scopeId }];
  } else if (ownerType === "agency") {
    contractWhere.tenantId = ownerId;
  } else if (ownerType === "solo_broker") {
    contractWhere.OR = [{ createdById: ownerId }, { userId: ownerId }];
  } else if (ownerType === "platform") {
    contractWhere.id = "__no_contract_scope__";
  }

  const riskWhere: Prisma.ComplianceRiskEventWhereInput = {
    ownerType,
    ownerId,
  };

  const run = await prisma.complianceReportRun.create({
    data: {
      runNumber: buildReportRunNumber(),
      ownerType,
      ownerId,
      reportDefinitionId,
      reportKey,
      reportType,
      scopeType,
      scopeId: scopeId || null,
      dateFrom: dateFromRaw ? new Date(dateFromRaw) : null,
      dateTo: dateToRaw ? new Date(dateToRaw) : null,
      requestedByActorId: generatedBySystem ? null : requestedByActorId,
      generatedBySystem,
      format,
      status: "draft",
      manifest: buildReportManifest({
        reportKey,
        reportType,
        scopeType,
        scopeId: scopeId || null,
        dateFrom: dateFromRaw,
        dateTo: dateToRaw,
        modules,
      }) as unknown as Prisma.InputJsonValue,
    },
  });

  const [auditRecords, complaints, trustDeposits, financialRecords, declarations, contracts, riskEvents] =
    await Promise.all([
      prisma.complianceAuditRecord.findMany({
        where: auditWhere,
        orderBy: { eventTimestamp: "asc" },
        take: 5000,
      }),
      prisma.complaintCase.findMany({
        where: complaintWhere,
        take: 2000,
      }),
      prisma.trustDeposit.findMany({
        where: trustWhere,
        take: 2000,
      }),
      prisma.cashReceiptForm.findMany({
        where: financialWhere,
        take: 3000,
      }),
      prisma.sellerDeclaration.findMany({
        where: declarationWhere,
        take: 2000,
      }),
      prisma.contract.findMany({
        where: contractWhere,
        take: 2000,
      }),
      prisma.complianceRiskEvent.findMany({
        where: riskWhere,
        take: 2000,
      }),
    ]);

  const items: Prisma.ComplianceReportItemCreateManyInput[] = [
    ...auditRecords.map((r, i) => ({
      complianceReportRunId: run.id,
      sourceType: "audit_record",
      sourceId: r.id,
      label: r.summary,
      category: r.moduleKey,
      sortOrder: i,
      metadata: {
        severity: r.severity,
        actionType: r.actionType,
        entityType: r.entityType,
      } as Prisma.InputJsonValue,
    })),
    ...complaints.map((c, i) => ({
      complianceReportRunId: run.id,
      sourceType: "complaint",
      sourceId: c.id,
      label: c.caseNumber,
      category: "complaints",
      sortOrder: 10_000 + i,
      metadata: {
        complaintType: c.complaintType,
        severity: c.severity,
        status: c.status,
      } as Prisma.InputJsonValue,
    })),
    ...trustDeposits.map((d, i) => ({
      complianceReportRunId: run.id,
      sourceType: "trust_deposit",
      sourceId: d.id,
      label: d.receiptNumber ?? d.id,
      category: "trust",
      sortOrder: 20_000 + i,
      metadata: {
        depositType: d.depositType,
        status: d.status,
        amountCents: d.amountCents,
      } as Prisma.InputJsonValue,
    })),
    ...financialRecords.map((f, i) => ({
      complianceReportRunId: run.id,
      sourceType: "cash_receipt",
      sourceId: f.id,
      label: f.receiptNumber,
      category: "financial",
      sortOrder: 30_000 + i,
      metadata: {
        amountCents: f.amountCents,
        paymentMethod: f.paymentMethod,
        receivedForType: f.receivedForType,
      } as Prisma.InputJsonValue,
    })),
    ...declarations.map((d, i) => ({
      complianceReportRunId: run.id,
      sourceType: "declaration",
      sourceId: d.id,
      label: `Seller declaration ${d.referenceNumber}`,
      category: "declarations",
      sortOrder: 40_000 + i,
      metadata: {
        status: d.status,
        listingId: d.listingId,
      } as Prisma.InputJsonValue,
    })),
    ...contracts.map((c, i) => ({
      complianceReportRunId: run.id,
      sourceType: "contract",
      sourceId: c.id,
      label: c.contractNumber ?? `Contract ${c.id}`,
      category: "contracts",
      sortOrder: 50_000 + i,
      metadata: {
        status: c.status,
        contractType: c.type,
      } as Prisma.InputJsonValue,
    })),
    ...riskEvents.map((r, i) => ({
      complianceReportRunId: run.id,
      sourceType: "risk_event",
      sourceId: r.id,
      label: r.description.slice(0, 500),
      category: "risk",
      sortOrder: 60_000 + i,
      metadata: {
        riskType: r.riskType,
        severity: r.severity,
      } as Prisma.InputJsonValue,
    })),
  ];

  if (items.length) {
    await prisma.complianceReportItem.createMany({ data: items });
  }

  const summary = summarizeReportCounts({
    auditRecords: auditRecords.length,
    complaints: complaints.length,
    trustDeposits: trustDeposits.length,
    financialRecords: financialRecords.length,
    declarations: declarations.length,
    contracts: contracts.length,
    riskEvents: riskEvents.length,
  });

  const updated = await prisma.complianceReportRun.update({
    where: { id: run.id },
    data: {
      status: "generated",
      generatedAt: new Date(),
      summary: summary as unknown as Prisma.InputJsonValue,
    },
    include: { items: true },
  });

  const actorId = requestedByActorId;
  await logAuditEvent({
    ownerType,
    ownerId,
    entityType: "compliance_report_run",
    entityId: updated.id,
    actionType: "generated",
    moduleKey: "general",
    actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId,
    severity: "info",
    summary: `Compliance report generated: ${updated.reportKey}`,
    details: {
      runNumber: updated.runNumber,
      reportType: updated.reportType,
      scopeType: updated.scopeType,
      scopeId: updated.scopeId,
      itemCount: updated.items.length,
      format: updated.format,
    },
  });

  await createAccountabilityRecord({
    ownerType,
    ownerId,
    entityType: "compliance_report_run",
    entityId: updated.id,
    actionKey: "generate_report",
    performedByActorId: actorId,
    accountableActorId: actorId,
    approvalRequired: false,
    approvalCompleted: true,
  });

  return NextResponse.json({ success: true, run: updated });
}
