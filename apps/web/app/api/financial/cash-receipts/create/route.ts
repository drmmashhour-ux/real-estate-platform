import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { classifyFundsDestination, validateCashReceipt } from "@/lib/compliance/financial-records";
import { buildReceiptNumber, buildFinancialEntryNumber } from "@/lib/compliance/financial-numbers";
import { requireBrokerOrAdminTrustSession } from "@/lib/compliance/trust-route-guard";
import { sessionOwnsFinancialOwner } from "@/lib/compliance/financial-route-guard";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";
import { enforceAction } from "@/lib/compliance/enforce-action";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireBrokerOrAdminTrustSession();
  if (!session.ok) return session.response;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  let ownerType = typeof body.ownerType === "string" ? body.ownerType.trim() : "";
  let ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";
  const agencyId = typeof body.agencyId === "string" ? body.agencyId.trim() || null : null;

  if (session.role === PlatformRole.BROKER) {
    if (agencyId) {
      ownerType = "agency";
      ownerId = agencyId;
    } else {
      ownerType = "solo_broker";
      ownerId = session.userId;
    }
  }

  if (!ownerType || !ownerId) {
    return NextResponse.json({ success: false, error: "OWNER_REQUIRED" }, { status: 400 });
  }

  if (ownerType === "platform" && session.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (!sessionOwnsFinancialOwner(ownerType, ownerId, session, { agencyId })) {
    return NextResponse.json({ success: false, error: "OWNER_FORBIDDEN" }, { status: 403 });
  }

  const blocked = await rejectIfInspectionReadOnlyMutation(req, {
    ownerType,
    ownerId,
    actorId: session.userId,
    actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
  });
  if (blocked) return blocked;

  const payerName = typeof body.payerName === "string" ? body.payerName : "";
  const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod : "";
  const receivedForType = typeof body.receivedForType === "string" ? body.receivedForType : "";
  const amountCents = typeof body.amountCents === "number" ? body.amountCents : NaN;

  const fundsDestinationTypeRaw =
    typeof body.fundsDestinationType === "string" && body.fundsDestinationType.trim()
      ? body.fundsDestinationType.trim()
      : classifyFundsDestination({ receivedForType, paymentMethod });

  const decision = validateCashReceipt({
    amountCents,
    paymentMethod,
    receivedForType,
    fundsDestinationType: fundsDestinationTypeRaw,
    payerName,
  });

  if (!decision.allowed) {
    return NextResponse.json({ success: false, error: decision.reason }, { status: 400 });
  }

  const fundsDestinationType = fundsDestinationTypeRaw;

  try {
    await enforceAction({
      ownerType: "solo_broker",
      ownerId: session.userId,
      actorId: session.userId,
      actionKey: "record_receipt",
      entityType: "cash_receipt",
      entityId: `${ownerType}:${ownerId}`,
      moduleKey: "financial",
      decisionOwnerType: ownerType,
      decisionOwnerId: ownerId,
      facts: {
        payerName,
        paymentMethod,
        amountCents,
        receivedForType,
        fundsDestinationType,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FINANCIAL_RECORD_BLOCKED";
    return NextResponse.json({ success: false, error: msg }, { status: 403 });
  }

  const payerUserId = typeof body.payerUserId === "string" ? body.payerUserId.trim() || null : null;
  const payerContact = typeof body.payerContact === "string" ? body.payerContact.trim() || null : null;
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() || null : null;
  const offerId = typeof body.offerId === "string" ? body.offerId.trim() || null : null;
  const contractId = typeof body.contractId === "string" ? body.contractId.trim() || null : null;
  const dealId = typeof body.dealId === "string" ? body.dealId.trim() || null : null;
  const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() || null : null;
  const trustDepositId = typeof body.trustDepositId === "string" ? body.trustDepositId.trim() || null : null;
  const receivedForLabel = typeof body.receivedForLabel === "string" ? body.receivedForLabel.trim() || null : null;
  const externalReference = typeof body.externalReference === "string" ? body.externalReference.trim() || null : null;
  const notes = typeof body.notes === "string" ? body.notes : null;
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : undefined;

  const receivedAt = body.receivedAt ? new Date(String(body.receivedAt)) : new Date();
  if (Number.isNaN(receivedAt.getTime())) {
    return NextResponse.json({ success: false, error: "INVALID_RECEIVED_AT" }, { status: 400 });
  }

  const brokerId =
    session.role === PlatformRole.BROKER
      ? session.userId
      : typeof body.brokerId === "string" && body.brokerId.trim()
        ? body.brokerId.trim()
        : null;

  const result = await prisma.$transaction(async (tx) => {
    const receipt = await tx.cashReceiptForm.create({
      data: {
        receiptNumber: buildReceiptNumber(),
        ownerType,
        ownerId,
        payerUserId,
        payerName: payerName.trim(),
        payerContact,
        listingId,
        offerId,
        contractId,
        dealId,
        bookingId,
        brokerId,
        agencyId,
        amountCents,
        paymentMethod,
        receivedForType,
        receivedForLabel,
        fundsDestinationType,
        externalReference,
        notes,
        receivedAt,
      },
    });

    const accountBucket =
      fundsDestinationType === "trust"
        ? "trust_liability"
        : fundsDestinationType === "operating"
          ? "operating_income"
          : fundsDestinationType === "platform_revenue"
            ? "platform_income"
            : "other";

    const ledgerEntry = await tx.financialLedgerEntry.create({
      data: {
        entryNumber: buildFinancialEntryNumber(),
        ownerType,
        ownerId,
        entryType: "receipt",
        accountBucket,
        direction: "credit",
        amountCents,
        cashReceiptFormId: receipt.id,
        trustDepositId,
        listingId,
        offerId,
        contractId,
        dealId,
        effectiveDate: receivedAt,
        description: description ?? `Receipt ${receipt.receiptNumber}`,
        createdById: session.userId,
      },
    });

    const periodKey = receivedAt.toISOString().slice(0, 7);
    const registerType =
      fundsDestinationType === "trust"
        ? "trust_receipts"
        : fundsDestinationType === "operating"
          ? "operating_receipts"
          : fundsDestinationType === "platform_revenue"
            ? "fee_income"
            : "cash_receipts";

    let register = await tx.financialRegister.findFirst({
      where: {
        ownerType,
        ownerId,
        registerType,
        periodKey,
      },
    });

    if (!register) {
      register = await tx.financialRegister.create({
        data: {
          ownerType,
          ownerId,
          registerType,
          registerDate: receivedAt,
          periodKey,
        },
      });
    }

    await tx.financialRegisterLink.create({
      data: {
        financialRegisterId: register.id,
        cashReceiptFormId: receipt.id,
        ledgerEntryId: ledgerEntry.id,
        trustDepositId,
      },
    });

    await tx.financialComplianceEvent.createMany({
      data: [
        {
          ownerType,
          ownerId,
          eventType: "cash_receipt_created",
          entityType: "cash_receipt",
          entityId: receipt.id,
          performedById: session.userId,
          details: {
            receiptNumber: receipt.receiptNumber,
            amountCents,
            fundsDestinationType,
          },
        },
        {
          ownerType,
          ownerId,
          eventType: "ledger_entry_created",
          entityType: "ledger_entry",
          entityId: ledgerEntry.id,
          performedById: session.userId,
          details: {
            entryNumber: ledgerEntry.entryNumber,
            accountBucket: ledgerEntry.accountBucket,
          },
        },
        {
          ownerType,
          ownerId,
          eventType: "register_linked",
          entityType: "register",
          entityId: register.id,
          performedById: session.userId,
          details: {
            registerType,
            periodKey,
          },
        },
      ],
    });

    return { receipt, ledgerEntry, register };
  });

  logComplianceEvent("CASH_RECEIPT_RECORDED", {
    receiptId: result.receipt.id,
    ownerType,
    ownerId,
    performedById: session.userId,
  });

  const actorType = session.role === PlatformRole.ADMIN ? "admin" : "broker";
  await logAuditEvent({
    ownerType,
    ownerId,
    entityType: "cash_receipt",
    entityId: result.receipt.id,
    actionType: "receipt_created",
    moduleKey: "financial",
    actorType,
    actorId: session.userId,
    linkedListingId: listingId,
    linkedOfferId: offerId,
    linkedContractId: contractId,
    linkedDealId: dealId,
    linkedTrustDepositId: trustDepositId,
    severity: "info",
    summary: "Cash receipt recorded",
    details: { receiptNumber: result.receipt.receiptNumber, amountCents, fundsDestinationType },
  });
  await logAuditEvent({
    ownerType,
    ownerId,
    entityType: "ledger_entry",
    entityId: result.ledgerEntry.id,
    actionType: "ledger_entry_created",
    moduleKey: "financial",
    actorType,
    actorId: session.userId,
    linkedListingId: listingId,
    linkedContractId: contractId,
    linkedDealId: dealId,
    linkedTrustDepositId: trustDepositId,
    severity: "info",
    summary: "Ledger entry created from receipt",
    details: { entryNumber: result.ledgerEntry.entryNumber, accountBucket: result.ledgerEntry.accountBucket },
  });
  await logAuditEvent({
    ownerType,
    ownerId,
    entityType: "financial_register",
    entityId: result.register.id,
    actionType: "register_linked",
    moduleKey: "financial",
    actorType,
    actorId: session.userId,
    severity: "info",
    summary: "Receipt linked to period register",
    details: { receiptId: result.receipt.id, ledgerEntryId: result.ledgerEntry.id },
  });

  return NextResponse.json({
    success: true,
    receipt: result.receipt,
    ledgerEntry: result.ledgerEntry,
    register: result.register,
    warning: decision.warning,
  });
}
