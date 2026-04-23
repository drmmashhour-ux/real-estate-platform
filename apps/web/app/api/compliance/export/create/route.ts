import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { assertComplianceOwnerAccess } from "@/lib/compliance/compliance-access";
import { buildBundleNumber, assertAuditOwnerMatchesBundleScope } from "@/lib/compliance/audit";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER && auth.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const ownerType = typeof body.ownerType === "string" ? body.ownerType.trim() : "";
  const ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";
  const bundleType = typeof body.bundleType === "string" ? body.bundleType.trim() : "";

  if (!ownerType || !ownerId || !bundleType) {
    return NextResponse.json({ success: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const access = await assertComplianceOwnerAccess(auth.user, ownerType, ownerId);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.message }, { status: 403 });
  }

  const blocked = await rejectIfInspectionReadOnlyMutation(req, {
    ownerType,
    ownerId,
    actorId: auth.user.id,
    actorType: auth.user.role === PlatformRole.ADMIN ? "admin" : "broker",
  });
  if (blocked) return blocked;

  const targetEntityType =
    typeof body.targetEntityType === "string" && body.targetEntityType.trim()
      ? body.targetEntityType.trim()
      : undefined;
  const targetEntityId =
    typeof body.targetEntityId === "string" && body.targetEntityId.trim() ? body.targetEntityId.trim() : undefined;
  const dateFrom = body.dateFrom ? new Date(String(body.dateFrom)) : null;
  const dateTo = body.dateTo ? new Date(String(body.dateTo)) : null;
  const modules = Array.isArray(body.modules) ? body.modules.map((m) => String(m)) : [];

  try {
    const bundle = await prisma.complianceExportBundle.create({
      data: {
        bundleNumber: buildBundleNumber(),
        ownerType,
        ownerId,
        bundleType,
        status: "draft",
        targetEntityType: targetEntityType ?? null,
        targetEntityId: targetEntityId ?? null,
        dateFrom: dateFrom && !Number.isNaN(dateFrom.getTime()) ? dateFrom : null,
        dateTo: dateTo && !Number.isNaN(dateTo.getTime()) ? dateTo : null,
        generatedById: auth.user.id,
        manifest: {
          requestedModules: modules,
          notes: body.notes ?? null,
        },
      },
    });

    const where: Prisma.ComplianceAuditRecordWhereInput = {
      ownerType,
      ownerId,
    };
    if (targetEntityType && targetEntityId) {
      where.entityType = targetEntityType;
      where.entityId = targetEntityId;
    }
    if (modules.length > 0) {
      where.moduleKey = { in: modules };
    }
    if (
      dateFrom &&
      !Number.isNaN(dateFrom.getTime()) &&
      dateTo &&
      !Number.isNaN(dateTo.getTime())
    ) {
      where.eventTimestamp = { gte: dateFrom, lte: dateTo };
    } else if (dateFrom && !Number.isNaN(dateFrom.getTime())) {
      where.eventTimestamp = { gte: dateFrom };
    } else if (dateTo && !Number.isNaN(dateTo.getTime())) {
      where.eventTimestamp = { lte: dateTo };
    }

    const auditRecords = await prisma.complianceAuditRecord.findMany({
      where,
      orderBy: { eventTimestamp: "asc" },
      take: 5000,
    });

    for (const record of auditRecords) {
      assertAuditOwnerMatchesBundleScope({
        recordOwnerType: record.ownerType,
        recordOwnerId: record.ownerId,
        bundleOwnerType: ownerType,
        bundleOwnerId: ownerId,
      });
    }

    if (auditRecords.length) {
      await prisma.complianceExportItem.createMany({
        data: auditRecords.map((record, index) => ({
          complianceExportBundleId: bundle.id,
          sourceType: "audit_record",
          sourceId: record.id,
          label: record.summary,
          sortOrder: index,
          metadata: {
            moduleKey: record.moduleKey,
            entityType: record.entityType,
            severity: record.severity,
            eventTimestamp: record.eventTimestamp,
          },
        })),
      });
    }

    const updatedBundle = await prisma.complianceExportBundle.update({
      where: { id: bundle.id },
      data: {
        status: "generated",
        generatedAt: new Date(),
        manifest: {
          requestedModules: modules,
          auditRecordCount: auditRecords.length,
          notes: body.notes ?? null,
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, bundle: updatedBundle });
  } catch (e) {
    if (e instanceof Error && e.message === "AUDIT_OWNER_SCOPE_MISMATCH") {
      return NextResponse.json({ success: false, error: e.message }, { status: 400 });
    }
    throw e;
  }
}
