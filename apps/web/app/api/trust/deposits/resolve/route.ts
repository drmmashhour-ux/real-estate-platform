import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { validateTrustRelease } from "@/lib/compliance/trust";
import { requireBrokerOrAdminTrustSession, depositVisibleToSession } from "@/lib/compliance/trust-route-guard";
import { ledgerOnDepositReleased, ledgerOnDepositRefunded } from "@/lib/compliance/trust-deposit-ledger-hook";
import { trustLedgerOwnerFromDeposit } from "@/lib/compliance/trust-ledger-context";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";
import { auditOwnerFromTrustDepositId, logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";
import { enforceComplianceAction } from "@/lib/compliance/enforce-compliance-action";
import { createComplianceAlert } from "@/lib/compliance/alerts";

export const dynamic = "force-dynamic";

const TERMINAL = new Set(["released", "refunded", "cancelled"]);

export async function POST(req: Request) {
  const session = await requireBrokerOrAdminTrustSession();
  if (!session.ok) return session.response;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const depositId = typeof body.depositId === "string" ? body.depositId.trim() : "";
  const action = typeof body.action === "string" ? body.action.trim() : "";
  const releaseRuleType = typeof body.releaseRuleType === "string" ? body.releaseRuleType.trim() || null : null;
  const note = typeof body.note === "string" ? body.note : null;

  if (!depositId) {
    return NextResponse.json({ success: false, error: "DEPOSIT_ID_REQUIRED" }, { status: 400 });
  }

  const deposit = await prisma.trustDeposit.findUnique({
    where: { id: depositId },
  });

  if (!deposit) {
    return NextResponse.json({ success: false, error: "DEPOSIT_NOT_FOUND" }, { status: 404 });
  }
  if (!depositVisibleToSession(deposit, session.userId, session.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const scopeTrust = await auditOwnerFromTrustDepositId(deposit.id);
  const insp = await rejectIfInspectionReadOnlyMutation(req, {
    ...scopeTrust,
    actorId: session.userId,
    actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
  });
  if (insp) return insp;

  if (action === "release" || action === "refund") {
    const decision = validateTrustRelease({
      status: deposit.status,
      releaseRuleType: releaseRuleType ?? deposit.releaseRuleType,
      disputed: deposit.status === "disputed",
      frozen: deposit.status === "frozen",
    });

    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: decision.reason }, { status: 400 });
    }

    const guard = await enforceComplianceAction({
      ownerType: scopeTrust.ownerType,
      ownerId: scopeTrust.ownerId,
      moduleKey: "trust",
      actionKey: "release_deposit",
      entityType: "trust_deposit",
      entityId: deposit.id,
      actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
      actorId: session.userId,
      facts: {
        depositStatus: deposit.status,
        releaseRulePresent: !!(releaseRuleType ?? deposit.releaseRuleType),
        manualReviewRequired: deposit.requiresManualReview === true,
      },
    });
    if (!guard.allowed) {
      return NextResponse.json(
        { success: false, error: guard.reasonCode ?? "TRUST_RELEASE_BLOCKED", message: guard.message },
        { status: 403 },
      );
    }
  }

  if (action === "dispute") {
    if (deposit.status === "disputed") {
      return NextResponse.json({ success: false, error: "ALREADY_DISPUTED" }, { status: 400 });
    }
    if (TERMINAL.has(deposit.status) || deposit.status === "frozen") {
      return NextResponse.json({ success: false, error: "DEPOSIT_NOT_DISPUTABLE" }, { status: 400 });
    }
  }

  if (action === "freeze") {
    if (deposit.status === "frozen") {
      return NextResponse.json({ success: false, error: "ALREADY_FROZEN" }, { status: 400 });
    }
    if (TERMINAL.has(deposit.status)) {
      return NextResponse.json({ success: false, error: "DEPOSIT_NOT_FREEZABLE" }, { status: 400 });
    }
  }

  const nextStatus =
    action === "release"
      ? "released"
      : action === "refund"
        ? "refunded"
        : action === "dispute"
          ? "disputed"
          : action === "freeze"
            ? "frozen"
            : null;

  if (!nextStatus) {
    return NextResponse.json({ success: false, error: "INVALID_ACTION" }, { status: 400 });
  }

  const updated = await prisma.trustDeposit.update({
    where: { id: depositId },
    data: {
      status: nextStatus,
      releaseRuleType: releaseRuleType ?? deposit.releaseRuleType,
      releasedAt: action === "release" ? new Date() : deposit.releasedAt,
      refundedAt: action === "refund" ? new Date() : deposit.refundedAt,
      notes: note ?? deposit.notes,
    },
  });

  const eventType =
    action === "release" ? "released" : action === "refund" ? "refunded" : action === "dispute" ? "disputed" : "frozen";

  await prisma.trustDepositEvent.create({
    data: {
      trustDepositId: updated.id,
      eventType,
      performedById: session.userId,
      details: {
        action,
        releaseRuleType: releaseRuleType ?? null,
        note: note ?? null,
      },
    },
  });

  const owner = await trustLedgerOwnerFromDeposit(updated.id);
  if (owner) {
    if (action === "release") {
      await ledgerOnDepositReleased(updated.id, { ...owner, actorId: session.userId });
    } else if (action === "refund") {
      await ledgerOnDepositRefunded(updated.id, { ...owner, actorId: session.userId });
    }
  }

  logComplianceEvent("TRUST_DEPOSIT_UPDATED", {
    depositId: updated.id,
    action,
    performedById: session.userId,
  });

  const scope = await auditOwnerFromTrustDepositId(updated.id);
  await logAuditEvent({
    ...scope,
    entityType: "trust_deposit",
    entityId: updated.id,
    actionType: eventType,
    moduleKey: "trust",
    actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: session.userId,
    linkedTrustDepositId: updated.id,
    severity: action === "dispute" || action === "freeze" ? "high" : "info",
    summary: `Trust deposit ${eventType.replace(/_/g, " ")}`,
    details: { action, releaseRuleType: releaseRuleType ?? null, note: note ?? null },
  });

  if (action === "dispute" || action === "freeze") {
    await createComplianceAlert({
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
      alertType: "trust",
      severity: "critical",
      title: "Trust deposit issue",
      description: "Deposit dispute or anomaly detected",
      entityType: "trust_deposit",
      entityId: updated.id,
    });
  }

  return NextResponse.json({ success: true, deposit: updated });
}
