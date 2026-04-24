import { NextRequest, NextResponse } from "next/server";
import type { OaciqBrokerDecisionType, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { OACIQ_AI_ASSIST_DISCLAIMER } from "@/lib/compliance/oaciq/broker-decision-constants";
import {
  assertBrokerDecisionConfirmation,
  assertLegallyBindingCallerNotAutomated,
  brokerDecisionAuthorityEnforced,
  recordOaciqBrokerDecision,
} from "@/lib/compliance/oaciq/broker-decision-authority";

export const dynamic = "force-dynamic";

const TYPES = new Set<string>([
  "PIPELINE_DEAL_CREATE",
  "CRM_DEAL_CREATE",
  "OFFER_SUBMIT",
  "CONTRACT_GENERATE",
  "LISTING_PUBLISH",
  "NEGOTIATION_STEP",
  "CONTRACT_SIGN",
]);

function parseType(s: unknown): OaciqBrokerDecisionType | null {
  if (typeof s !== "string" || !TYPES.has(s)) return null;
  return s as OaciqBrokerDecisionType;
}

async function resolveResponsibleBrokerForRequest(input: {
  authUserId: string;
  role: PlatformRole;
  body: Record<string, unknown>;
  decisionType: OaciqBrokerDecisionType;
}): Promise<{ responsibleBrokerId: string } | { error: string; status: number }> {
  const txId =
    typeof input.body.realEstateTransactionId === "string"
      ? input.body.realEstateTransactionId.trim()
      : "";
  const crmDealId = typeof input.body.crmDealId === "string" ? input.body.crmDealId.trim() : "";
  const listingId = typeof input.body.listingId === "string" ? input.body.listingId.trim() : "";

  if (input.role === "ADMIN") {
    const designated =
      typeof input.body.responsibleBrokerId === "string" ? input.body.responsibleBrokerId.trim() : "";
    if (!designated) {
      return { error: "Administrators must pass responsibleBrokerId for the attested licensee.", status: 400 };
    }
    return { responsibleBrokerId: designated };
  }

  if (!requireBrokerOrAdmin(input.role)) {
    return { error: "Broker or administrator access required", status: 403 };
  }

  if (txId) {
    const tx = await prisma.realEstateTransaction.findUnique({
      where: { id: txId },
      select: { brokerId: true },
    });
    if (!tx?.brokerId) {
      return { error: "Transaction has no assigned broker to attest.", status: 400 };
    }
    if (tx.brokerId !== input.authUserId) {
      return { error: "Only the transaction's assigned broker may record this decision.", status: 403 };
    }
    return { responsibleBrokerId: tx.brokerId };
  }

  if (crmDealId) {
    const d = await prisma.deal.findUnique({
      where: { id: crmDealId },
      select: { brokerId: true },
    });
    if (!d?.brokerId) {
      return { error: "Deal has no broker to attest.", status: 400 };
    }
    if (d.brokerId !== input.authUserId) {
      return { error: "Only the deal's broker may record this decision.", status: 403 };
    }
    return { responsibleBrokerId: d.brokerId };
  }

  if (listingId && input.decisionType === "OFFER_SUBMIT") {
    const row = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });
    if (!row?.ownerId) return { error: "Listing not found or has no owner broker.", status: 404 };
    if (row.ownerId !== input.authUserId) {
      return { error: "Only the listing's broker owner may attest offer submission for this listing.", status: 403 };
    }
    return { responsibleBrokerId: row.ownerId };
  }

  return { responsibleBrokerId: input.authUserId };
}

/**
 * POST — record a broker decision attestation (after UI confirmation). Used for pre-approval gates (e.g. OFFER_SUBMIT, CONTRACT_SIGN).
 */
export async function POST(req: NextRequest) {
  if (!brokerDecisionAuthorityEnforced()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      disclaimer: OACIQ_AI_ASSIST_DISCLAIMER,
    });
  }

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const decisionType = parseType(body.decisionType);
  if (!decisionType) {
    return NextResponse.json({ error: "Valid decisionType is required" }, { status: 400 });
  }

  try {
    assertLegallyBindingCallerNotAutomated(body);
    assertBrokerDecisionConfirmation(body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const resolved = await resolveResponsibleBrokerForRequest({
    authUserId: auth.userId,
    role: auth.role,
    body,
    decisionType,
  });
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const pipelineDealId =
    typeof body.pipelineDealId === "string" ? body.pipelineDealId.trim() || null : null;
  const realEstateTransactionId =
    typeof body.realEstateTransactionId === "string" ? body.realEstateTransactionId.trim() || null : null;
  const crmDealId = typeof body.crmDealId === "string" ? body.crmDealId.trim() || null : null;
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() || null : null;

  try {
    const row = await recordOaciqBrokerDecision({
      responsibleBrokerId: resolved.responsibleBrokerId,
      decisionType,
      confirmedByUserId: auth.userId,
      scope: {
        pipelineDealId,
        realEstateTransactionId,
        crmDealId,
        listingId,
        metadata: { source: "broker_decision_api" },
      },
    });
    return NextResponse.json({
      ok: true,
      id: row.id,
      disclaimer: OACIQ_AI_ASSIST_DISCLAIMER,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
