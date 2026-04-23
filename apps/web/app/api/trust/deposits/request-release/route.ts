import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireBrokerOrAdminTrustSession, depositVisibleToSession } from "@/lib/compliance/trust-route-guard";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";
import { auditOwnerFromTrustDepositId, logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireBrokerOrAdminTrustSession();
  if (!session.ok) return session.response;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const depositId = typeof body.depositId === "string" ? body.depositId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason : null;

  if (!depositId) {
    return NextResponse.json({ success: false, error: "DEPOSIT_ID_REQUIRED" }, { status: 400 });
  }

  const existing = await prisma.trustDeposit.findUnique({ where: { id: depositId } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "DEPOSIT_NOT_FOUND" }, { status: 404 });
  }
  if (!depositVisibleToSession(existing, session.userId, session.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const scopeInsp = await auditOwnerFromTrustDepositId(existing.id);
  const blocked = await rejectIfInspectionReadOnlyMutation(req, {
    ...scopeInsp,
    actorId: session.userId,
    actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
  });
  if (blocked) return blocked;

  if (existing.status !== "held_in_trust") {
    return NextResponse.json({ success: false, error: "DEPOSIT_NOT_HELD_IN_TRUST" }, { status: 400 });
  }

  const deposit = await prisma.trustDeposit.update({
    where: { id: depositId },
    data: {
      status: "release_requested",
      notes: reason ?? existing.notes,
    },
  });

  await prisma.trustDepositEvent.create({
    data: {
      trustDepositId: deposit.id,
      eventType: "release_requested",
      performedById: session.userId,
      details: { reason },
    },
  });

  logComplianceEvent("TRUST_DEPOSIT_UPDATED", {
    depositId: deposit.id,
    action: "release_requested",
    performedById: session.userId,
  });

  const scopeLog = await auditOwnerFromTrustDepositId(deposit.id);
  await logAuditEvent({
    ...scopeLog,
    entityType: "trust_deposit",
    entityId: deposit.id,
    actionType: "release_requested",
    moduleKey: "trust",
    actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: session.userId,
    linkedTrustDepositId: deposit.id,
    severity: "info",
    summary: "Trust deposit release requested",
    details: { reason },
  });

  return NextResponse.json({ success: true, deposit });
}
