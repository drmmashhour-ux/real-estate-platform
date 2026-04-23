import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { complianceFlags, legalIntelligenceFlags } from "@/config/feature-flags";
import { getLegalIntelligenceSignals } from "@/modules/legal/legal-intelligence.service";
import {
  buildLegalFraudEngineSummary,
  buildLegalFraudReviewSignals,
  normalizeLegalFraudIndicators,
} from "@/modules/legal/legal-fraud-engine.service";

export const dynamic = "force-dynamic";

function safeEntityId(raw: string | null): string | null {
  if (!raw || raw.length > 128) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(raw)) return null;
  return raw;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (me?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const generatedAt = new Date().toISOString();

    if (!legalIntelligenceFlags.legalIntelligenceV1 || !legalIntelligenceFlags.legalFraudEngineV1) {
      return NextResponse.json({
        summary: null,
        indicators: [],
        reviewSignals: [],
        flags: {
          legalIntelligenceV1: legalIntelligenceFlags.legalIntelligenceV1 === true,
          legalFraudEngineV1: legalIntelligenceFlags.legalFraudEngineV1 === true,
        },
        freshness: { generatedAt },
      });
    }

    const sp = req.nextUrl.searchParams;
    const entityType = sp.get("entityType") ?? "fsbo_listing";
    const entityIdRaw = safeEntityId(sp.get("entityId"));

    const entityId = entityIdRaw ?? "global";
    const signals = await getLegalIntelligenceSignals({
      entityType,
      entityId,
      actorType: "admin",
      workflowType: "legal_fraud_engine",
    });

    let indicators = normalizeLegalFraudIndicators(signals);
    if (complianceFlags.quebecComplianceV1 && entityIdRaw && entityType === "fsbo_listing") {
      try {
        const { evaluateListingPublishComplianceDecision } = await import(
          "@/modules/legal/compliance/listing-publish-compliance.service"
        );
        const qc = await evaluateListingPublishComplianceDecision(entityIdRaw);
        const criticalOrWarningSignalsPresent = signals.some(
          (s) => s.severity === "critical" || s.severity === "warning",
        );
        indicators = escalateIndicatorsForComplianceConflict(indicators, {
          complianceBlocked: Boolean(qc.apply && !qc.decision.allowed),
          criticalOrWarningSignalsPresent,
        });
      } catch {
        /* keep base indicators */
      }
    }
    const reviewSignals = buildLegalFraudReviewSignals(indicators);
    const summary = buildLegalFraudEngineSummary({ builtAt: generatedAt, signals, indicators });

    return NextResponse.json({
      summary,
      indicators,
      reviewSignals,
      flags: {
        legalIntelligenceV1: true,
        legalFraudEngineV1: true,
        scoped: entityId !== "global",
      },
      freshness: { generatedAt },
    });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
