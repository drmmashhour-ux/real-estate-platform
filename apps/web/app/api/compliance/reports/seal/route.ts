import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/get-session";
import { assertComplianceOwnerAccess } from "@/lib/compliance/compliance-access";
import { assertReportRunMutable } from "@/lib/compliance/reporting-guards";
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
  const runId = typeof body.runId === "string" ? body.runId.trim() : "";
  const actorId =
    typeof body.actorId === "string" && body.actorId.trim() ? body.actorId.trim() : user.id;

  if (!runId) {
    return NextResponse.json({ success: false, error: "RUN_ID_REQUIRED" }, { status: 400 });
  }

  if (user.role === PlatformRole.BROKER && actorId !== user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.complianceReportRun.findUnique({ where: { id: runId } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    assertReportRunMutable(existing);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "IMMUTABLE_REPORT";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  const access = await assertComplianceOwnerAccess(user, existing.ownerType, existing.ownerId);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.message }, { status: 403 });
  }

  const run = await prisma.complianceReportRun.update({
    where: { id: runId },
    data: {
      status: "sealed",
      sealedAt: new Date(),
    },
  });

  await logAuditEvent({
    ownerType: run.ownerType,
    ownerId: run.ownerId,
    entityType: "compliance_report_run",
    entityId: run.id,
    actionType: "sealed",
    moduleKey: "general",
    actorType: user.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId,
    severity: "info",
    summary: `Compliance report sealed: ${run.reportKey}`,
    details: {
      runNumber: run.runNumber,
      sealedAt: run.sealedAt?.toISOString() ?? null,
    },
  });

  await createAccountabilityRecord({
    ownerType: run.ownerType,
    ownerId: run.ownerId,
    entityType: "compliance_report_run",
    entityId: run.id,
    actionKey: "seal_report",
    performedByActorId: actorId,
    accountableActorId: actorId,
    approvalRequired: false,
    approvalCompleted: true,
  });

  return NextResponse.json({ success: true, run });
}
