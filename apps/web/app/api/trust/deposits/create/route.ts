import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { validateTrustDepositCreation } from "@/lib/compliance/trust";
import { requireBrokerOrAdminTrustSession, sessionOwnsTrustProfile } from "@/lib/compliance/trust-route-guard";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireBrokerOrAdminTrustSession();
  if (!session.ok) return session.response;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() || null : null;
  const offerId = typeof body.offerId === "string" ? body.offerId.trim() || null : null;
  const contractId = typeof body.contractId === "string" ? body.contractId.trim() || null : null;
  const payerUserId = typeof body.payerUserId === "string" ? body.payerUserId.trim() || null : null;
  const agencyId = typeof body.agencyId === "string" ? body.agencyId.trim() || null : null;
  const trustAccountProfileId =
    typeof body.trustAccountProfileId === "string" ? body.trustAccountProfileId.trim() : "";
  const depositType = typeof body.depositType === "string" ? body.depositType : "";
  const contextType = typeof body.contextType === "string" ? body.contextType : "";
  const amountCents = typeof body.amountCents === "number" ? body.amountCents : NaN;
  const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod.trim() || null : null;
  const externalReference = typeof body.externalReference === "string" ? body.externalReference.trim() || null : null;
  const releaseRuleType = typeof body.releaseRuleType === "string" ? body.releaseRuleType.trim() || null : null;
  const releaseRuleText = typeof body.releaseRuleText === "string" ? body.releaseRuleText : null;

  if (!trustAccountProfileId) {
    return NextResponse.json({ success: false, error: "TRUST_PROFILE_REQUIRED" }, { status: 400 });
  }

  const trustProfile = await prisma.trustAccountProfile.findUnique({
    where: { id: trustAccountProfileId },
  });

  if (!trustProfile) {
    return NextResponse.json({ success: false, error: "TRUST_PROFILE_NOT_FOUND" }, { status: 404 });
  }

  if (!sessionOwnsTrustProfile(trustProfile, session, { agencyId })) {
    return NextResponse.json({ success: false, error: "TRUST_PROFILE_FORBIDDEN" }, { status: 403 });
  }

  const blocked = await rejectIfInspectionReadOnlyMutation(req, {
    ownerType: trustProfile.ownerType,
    ownerId: trustProfile.ownerId,
    actorId: session.userId,
    actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
  });
  if (blocked) return blocked;

  const brokerId =
    session.role === PlatformRole.BROKER
      ? session.userId
      : typeof body.brokerId === "string" && body.brokerId.trim()
        ? body.brokerId.trim()
        : null;

  if (!brokerId) {
    return NextResponse.json({ success: false, error: "BROKER_ID_REQUIRED" }, { status: 400 });
  }

  if (session.role === PlatformRole.BROKER && brokerId !== session.userId) {
    return NextResponse.json({ success: false, error: "BROKER_ID_MISMATCH" }, { status: 403 });
  }

  const decision = validateTrustDepositCreation({
    depositType,
    contextType,
    amountCents,
    trustAccountEnabled: !!trustProfile.trustAccountEnabled,
    releaseRuleText,
  });

  if (!decision.allowed) {
    return NextResponse.json({ success: false, error: decision.reason }, { status: 400 });
  }

  const deposit = await prisma.trustDeposit.create({
    data: {
      listingId,
      offerId,
      contractId,
      payerUserId,
      brokerId,
      agencyId,
      trustAccountProfileId,
      depositType,
      contextType,
      amountCents,
      paymentMethod,
      externalReference,
      releaseRuleType,
      releaseRuleText,
      status: "pending_receipt",
      complianceFlags: [],
    },
  });

  await prisma.trustDepositEvent.create({
    data: {
      trustDepositId: deposit.id,
      eventType: "created",
      performedById: session.userId,
      details: {
        amountCents,
        depositType,
        contextType,
      },
    },
  });

  logComplianceEvent("TRUST_DEPOSIT_UPDATED", {
    depositId: deposit.id,
    action: "created",
    performedById: session.userId,
  });

  await logAuditEvent({
    ownerType: trustProfile.ownerType,
    ownerId: trustProfile.ownerId,
    entityType: "trust_deposit",
    entityId: deposit.id,
    actionType: "created",
    moduleKey: "trust",
    actorType: session.role === PlatformRole.ADMIN ? "admin" : "broker",
    actorId: session.userId,
    linkedListingId: listingId,
    linkedOfferId: offerId,
    linkedContractId: contractId,
    linkedTrustDepositId: deposit.id,
    severity: "info",
    summary: "Trust deposit created",
    details: { status: deposit.status, amountCents, depositType, contextType },
  });

  return NextResponse.json({ success: true, deposit, warning: decision.warning });
}
