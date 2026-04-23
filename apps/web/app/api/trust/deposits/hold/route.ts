import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireBrokerOrAdminTrustSession, depositVisibleToSession } from "@/lib/compliance/trust-route-guard";
import { ledgerOnDepositHeld } from "@/lib/compliance/trust-deposit-ledger-hook";
import { trustLedgerOwnerFromDeposit } from "@/lib/compliance/trust-ledger-context";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";
import { auditOwnerFromTrustDepositId, logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";
import { enforceAction } from "@/lib/compliance/enforce-action";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireBrokerOrAdminTrustSession();
  if (!session.ok) return session.response;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const depositId = typeof body.depositId === "string" ? body.depositId.trim() : "";

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
  if (existing.status !== "received") {
    return NextResponse.json({ success: false, error: "DEPOSIT_NOT_RECEIVED" }, { status: 400 });
  }

  try {
    await enforceAction({
      ownerType: "solo_broker",
      ownerId: session.userId,
      actorId: session.userId,
      actionKey: "trust_deposit_hold",
      entityType: "trust_deposit",
      entityId: depositId,
      moduleKey: "trust",
      facts: { depositId, priorStatus: existing.status },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ACTION_BLOCKED";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }

  const deposit = await prisma.trustDeposit.update({
    where: { id: depositId },
    data: {
      status: "held_in_trust",
      heldAt: new Date(),
    },
  });

  await prisma.trustDepositEvent.create({
    data: {
      trustDepositId: deposit.id,
      eventType: "held_in_trust",
      performedById: session.userId,
    },
  });

  const owner = await trustLedgerOwnerFromDeposit(deposit.id);
  if (owner) {
    await ledgerOnDepositHeld(deposit.id, { ...owner, actorId: session.userId });
  }

  logComplianceEvent("TRUST_DEPOSIT_UPDATED", {
    depositId: deposit.id,
    action: "held_in_trust",
    performedById: session.userId,
  });

  const scopeLog = await auditOwnerFromTrustDepositId(deposit.id);
  await logAuditEvent({
    ...scopeLog,
    entityType: "trust_deposit",
    entityId: deposit.id,
    actionType: "held_in_trust",
    moduleKey: "trust",
    actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: session.userId,
    linkedListingId: deposit.listingId,
    linkedTrustDepositId: deposit.id,
    severity: "info",
    summary: "Deposit held in trust",
    details: { status: deposit.status },
  });

  return NextResponse.json({ success: true, deposit });
}
