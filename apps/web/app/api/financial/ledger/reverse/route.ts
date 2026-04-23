import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canModifyLedgerEntry } from "@/lib/compliance/financial-records";
import { buildFinancialEntryNumber } from "@/lib/compliance/financial-numbers";
import { requireBrokerOrAdminTrustSession } from "@/lib/compliance/trust-route-guard";
import { sessionOwnsFinancialOwner } from "@/lib/compliance/financial-route-guard";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";
import { enforceComplianceAction } from "@/lib/compliance/enforce-compliance-action";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireBrokerOrAdminTrustSession();
  if (!session.ok) return session.response;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const entryId = typeof body.entryId === "string" ? body.entryId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason : null;
  const agencyId = typeof body.agencyId === "string" ? body.agencyId.trim() || null : null;

  if (!entryId) {
    return NextResponse.json({ success: false, error: "ENTRY_ID_REQUIRED" }, { status: 400 });
  }

  const entry = await prisma.financialLedgerEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    return NextResponse.json({ success: false, error: "LEDGER_ENTRY_NOT_FOUND" }, { status: 404 });
  }

  if (
    session.role !== PlatformRole.ADMIN &&
    !sessionOwnsFinancialOwner(entry.ownerType, entry.ownerId, session, { agencyId })
  ) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (entry.entryType === "reversal") {
    return NextResponse.json({ success: false, error: "CANNOT_REVERSE_REVERSAL" }, { status: 400 });
  }

  const existingReversal = await prisma.financialLedgerEntry.findFirst({
    where: { relatedEntryId: entryId, entryType: "reversal" },
    select: { id: true },
  });
  if (existingReversal) {
    return NextResponse.json({ success: false, error: "ALREADY_REVERSED" }, { status: 400 });
  }

  const decision = canModifyLedgerEntry({
    locked: entry.locked,
    requestedAction: "reverse",
  });

  if (!decision.allowed) {
    return NextResponse.json({ success: false, error: decision.reason }, { status: 400 });
  }

  const guard = await enforceComplianceAction({
    ownerType: entry.ownerType,
    ownerId: entry.ownerId,
    moduleKey: "financial",
    actionKey: "reverse_ledger_entry",
    entityType: "ledger_entry",
    entityId: entry.id,
    actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: session.userId,
    facts: {
      reasonProvided: typeof reason === "string" && reason.trim().length > 0,
    },
  });
  if (!guard.allowed) {
    return NextResponse.json(
      { success: false, error: guard.reasonCode ?? "LEDGER_REVERSAL_BLOCKED", message: guard.message },
      { status: 403 },
    );
  }

  const reversalDirection =
    entry.direction === "credit" ? "debit" : entry.direction === "debit" ? "credit" : "memo";

  const reversal = await prisma.financialLedgerEntry.create({
    data: {
      ownerType: entry.ownerType,
      ownerId: entry.ownerId,
      entryNumber: buildFinancialEntryNumber(),
      entryType: "reversal",
      accountBucket: entry.accountBucket,
      direction: reversalDirection,
      amountCents: entry.amountCents,
      currency: entry.currency,
      cashReceiptFormId: entry.cashReceiptFormId,
      trustDepositId: entry.trustDepositId,
      relatedEntryId: entry.id,
      listingId: entry.listingId,
      offerId: entry.offerId,
      contractId: entry.contractId,
      dealId: entry.dealId,
      effectiveDate: new Date(),
      description: `Reversal of ${entry.entryNumber}: ${reason ?? "No reason provided"}`,
      createdById: session.userId,
    },
  });

  await prisma.financialComplianceEvent.create({
    data: {
      ownerType: entry.ownerType,
      ownerId: entry.ownerId,
      eventType: "reversal_created",
      entityType: "ledger_entry",
      entityId: reversal.id,
      performedById: session.userId,
      details: {
        originalEntryId: entry.id,
        originalEntryNumber: entry.entryNumber,
        reversalEntryNumber: reversal.entryNumber,
        reason: reason ?? null,
      },
    },
  });

  await prisma.financialLedgerEntry.update({
    where: { id: entry.id },
    data: { locked: true },
  });

  await logAuditEvent({
    ownerType: entry.ownerType,
    ownerId: entry.ownerId,
    entityType: "ledger_entry",
    entityId: reversal.id,
    actionType: "reversal_created",
    moduleKey: "financial",
    actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: session.userId,
    linkedListingId: entry.listingId,
    linkedContractId: entry.contractId,
    linkedDealId: entry.dealId,
    linkedTrustDepositId: entry.trustDepositId,
    severity: "info",
    summary: "Ledger reversal entry created",
    details: {
      originalEntryId: entry.id,
      originalEntryNumber: entry.entryNumber,
      reversalEntryNumber: reversal.entryNumber,
      reason: reason ?? null,
    },
  });

  return NextResponse.json({ success: true, reversal });
}
