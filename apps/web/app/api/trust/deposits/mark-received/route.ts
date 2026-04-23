import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireBrokerOrAdminTrustSession, depositVisibleToSession } from "@/lib/compliance/trust-route-guard";
import { ledgerOnDepositReceived } from "@/lib/compliance/trust-deposit-ledger-hook";
import { trustLedgerOwnerFromDeposit } from "@/lib/compliance/trust-ledger-context";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";
import { auditOwnerFromTrustDepositId, logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireBrokerOrAdminTrustSession();
  if (!session.ok) return session.response;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const depositId = typeof body.depositId === "string" ? body.depositId.trim() : "";
  const receiptNumber = typeof body.receiptNumber === "string" ? body.receiptNumber.trim() || null : null;

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

  const scope = await auditOwnerFromTrustDepositId(existing.id);
  const blocked = await rejectIfInspectionReadOnlyMutation(req, {
    ...scope,
    actorId: session.userId,
    actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
  });
  if (blocked) return blocked;

  if (existing.status !== "pending_receipt") {
    return NextResponse.json({ success: false, error: "DEPOSIT_NOT_PENDING_RECEIPT" }, { status: 400 });
  }

  const deposit = await prisma.trustDeposit.update({
    where: { id: depositId },
    data: {
      status: "received",
      receiptNumber,
      receivedAt: new Date(),
    },
  });

  await prisma.trustDepositEvent.create({
    data: {
      trustDepositId: deposit.id,
      eventType: "marked_received",
      performedById: session.userId,
      details: { receiptNumber },
    },
  });

  const owner = await trustLedgerOwnerFromDeposit(deposit.id);
  if (owner) {
    await ledgerOnDepositReceived(deposit.id, { ...owner, actorId: session.userId });
  }

  logComplianceEvent("TRUST_DEPOSIT_UPDATED", {
    depositId: deposit.id,
    action: "marked_received",
    performedById: session.userId,
  });

  const scopeAfter = await auditOwnerFromTrustDepositId(deposit.id);
  await logAuditEvent({
    ...scopeAfter,
    entityType: "trust_deposit",
    entityId: deposit.id,
    actionType: "received",
    moduleKey: "trust",
    actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: session.userId,
    linkedListingId: deposit.listingId,
    linkedTrustDepositId: deposit.id,
    severity: "info",
    summary: "Trust deposit marked received",
    details: { receiptNumber, status: deposit.status },
  });

  return NextResponse.json({ success: true, deposit });
}
