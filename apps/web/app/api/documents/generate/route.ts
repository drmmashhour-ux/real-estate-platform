import { NextResponse } from "next/server";
import type { LecipmLegalDocumentTemplateKind } from "@prisma/client";
import { requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import {
  assertCapitalAccess,
  generateLegalDocumentArtifact,
  legalDocumentsEngineEnabled,
} from "@/modules/legal-documents";
import { prisma } from "@/lib/db";
import {
  assertBrokerDecisionConfirmation,
  assertLegallyBindingCallerNotAutomated,
  brokerDecisionAuthorityEnforced,
  recordOaciqBrokerDecision,
} from "@/lib/compliance/oaciq/broker-decision-authority";
import {
  OaciqAlignmentError,
  enforceOaciqAlignmentOrThrow,
} from "@/lib/compliance/oaciq/oaciq-alignment-layer.service";

export const dynamic = "force-dynamic";

const KINDS = new Set<string>([
  "PROMISE_TO_PURCHASE",
  "COUNTER_PROPOSAL",
  "AMENDMENT",
  "BROKER_DISCLOSURE",
  "CONFLICT_DISCLOSURE",
  "SUBSCRIPTION_AGREEMENT",
  "INVESTOR_MEMO",
  "RISK_DISCLOSURE",
  "EXEMPTION_REPRESENTATION",
  "INVESTOR_QUESTIONNAIRE",
  "DEAL_INVESTOR_HANDOFF_PACKET",
]);

export async function POST(req: Request) {
  if (!legalDocumentsEngineEnabled()) {
    return NextResponse.json({ error: "Legal documents engine disabled" }, { status: 503 });
  }
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as {
    kind?: string;
    dealId?: string | null;
    capitalDealId?: string | null;
  };
  if (!body.kind || !KINDS.has(body.kind)) {
    return NextResponse.json({ error: "Invalid or missing kind" }, { status: 400 });
  }

  const needsBroker = Boolean(body.dealId);
  const capitalOnly = Boolean(body.capitalDealId) && !body.dealId;
  if (needsBroker && !requireBrokerOrAdmin(auth.role)) {
    return NextResponse.json({ error: "Broker or administrator access required for deal-linked documents" }, { status: 403 });
  }
  if (capitalOnly) {
    try {
      await assertCapitalAccess(body.capitalDealId!, auth.userId, auth.role);
    } catch {
      return NextResponse.json({ error: "Forbidden — capital deal sponsor or admin only" }, { status: 403 });
    }
  }

  try {
    if (brokerDecisionAuthorityEnforced() && body.dealId) {
      assertLegallyBindingCallerNotAutomated(body as Record<string, unknown>);
      assertBrokerDecisionConfirmation(body as Record<string, unknown>);
    }

    if (body.dealId) {
      const dealRow = await prisma.deal.findUnique({
        where: { id: body.dealId },
        select: { brokerId: true, listingId: true },
      });
      const alignmentBrokerId = dealRow?.brokerId ?? auth.userId;
      try {
        await enforceOaciqAlignmentOrThrow({
          brokerId: alignmentBrokerId,
          action: "CONTRACT_GENERATE",
          crmDealId: body.dealId,
          listingId: dealRow?.listingId ?? null,
        });
      } catch (e) {
        if (e instanceof OaciqAlignmentError) {
          return NextResponse.json(
            { error: e.message, code: "OACIQ_ALIGNMENT_BLOCK", rules: e.failedSummaries },
            { status: 403 },
          );
        }
        throw e;
      }
    }

    const r = await generateLegalDocumentArtifact({
      kind: body.kind as LecipmLegalDocumentTemplateKind,
      dealId: body.dealId ?? null,
      capitalDealId: body.capitalDealId ?? null,
      userId: auth.userId,
      role: auth.role,
    });

    if (brokerDecisionAuthorityEnforced() && body.dealId) {
      const dealRow = await prisma.deal.findUnique({
        where: { id: body.dealId },
        select: { brokerId: true },
      });
      const responsibleBrokerId = dealRow?.brokerId ?? auth.userId;
      await recordOaciqBrokerDecision({
        responsibleBrokerId,
        decisionType: "CONTRACT_GENERATE",
        confirmedByUserId: auth.userId,
        scope: { crmDealId: body.dealId, legalDocumentArtifactId: r.id },
      });
    }

    return NextResponse.json({
      id: r.id,
      disclaimer:
        "Generated content is assistive only — not legal advice. Broker must approve before any outbound dispatch.",
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Generate failed" }, { status: 400 });
  }
}
