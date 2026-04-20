import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { complianceFlags, engineFlags } from "@/config/feature-flags";
import {
  evaluateQuebecListingCompliance,
  buildPropertyPublishComplianceSummary,
} from "@/modules/legal/compliance/quebec-listing-compliance-evaluator.service";
import { computePropertyLegalRiskScore } from "@/modules/legal/scoring/property-legal-risk-score.service";
import {
  computeLegalTrustRankingImpact,
  applyLegalTrustRanking,
} from "@/modules/trust-ranking/legal-trust-ranking.service";
import type { TrustScore } from "@/modules/trust/trust.types";
import { loadQuebecComplianceEvaluatorInput } from "@/modules/legal/compliance/listing-publish-compliance.service";

export const dynamic = "force-dynamic";

function safeListingId(raw: string | null): string | null {
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

    const listingId = safeListingId(req.nextUrl.searchParams.get("listingId"));
    if (!listingId) {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }

    const generatedAt = new Date().toISOString();

    if (
      !complianceFlags.quebecComplianceV1 ||
      !complianceFlags.quebecListingComplianceV1 ||
      !complianceFlags.propertyLegalRiskScoreV1
    ) {
      return NextResponse.json({
        compliance: null,
        legalRiskScore: null,
        rankingImpact: null,
        flags: {
          quebecComplianceV1: complianceFlags.quebecComplianceV1 === true,
          quebecListingComplianceV1: complianceFlags.quebecListingComplianceV1 === true,
          propertyLegalRiskScoreV1: complianceFlags.propertyLegalRiskScoreV1 === true,
          legalTrustRankingV1: engineFlags.legalTrustRankingV1 === true,
        },
        freshness: { generatedAt },
      });
    }

    const inp = await loadQuebecComplianceEvaluatorInput(listingId);
    if (!inp) {
      return NextResponse.json(
        {
          compliance: null,
          legalRiskScore: null,
          rankingImpact: null,
          flags: {},
          freshness: { generatedAt },
          notes: ["listing_context_unavailable"],
        },
        { status: 404 },
      );
    }

    const ce = evaluateQuebecListingCompliance({ evaluatorInput: inp });
    const lr = computePropertyLegalRiskScore({
      listingId,
      complianceEvaluation: ce,
      manualReviewCompleted: false,
      identityVerifiedStrong:
        inp.listing.verificationIdentityStage === "VERIFIED" ||
        inp.listing.verificationIdentityStage === "APPROVED",
      ownershipRecordValidated: (inp.legalRecords ?? []).some(
        (r) => r.recordType === "proof_of_ownership" && r.status === "validated",
      ),
      rejectionCycles: inp.documentRejectionLoop ? 3 : 0,
    });

    const publishSummary = buildPropertyPublishComplianceSummary({
      listingId,
      evaluation: ce,
      legalRiskScore: lr.score,
    });

    const trustStub: TrustScore = {
      score: 58,
      level: "medium",
      confidence: "low",
      factors: [],
    };

    const rankingImpact =
      engineFlags.legalTrustRankingV1 === true ?
        computeLegalTrustRankingImpact({
          listingId,
          trustScore: trustStub,
          publishSummary,
          prepublishBlocked: !ce.requiredChecklistPassed,
          isPublishedVisible: false,
        })
      : null;

    const rankingDecision =
      rankingImpact != null ? applyLegalTrustRanking(100, rankingImpact) : null;

    return NextResponse.json({
      compliance: publishSummary,
      legalRiskScore: lr,
      rankingImpact: rankingImpact,
      rankingDecision,
      flags: {
        quebecComplianceV1: true,
        quebecListingComplianceV1: true,
        propertyLegalRiskScoreV1: true,
        legalTrustRankingV1: engineFlags.legalTrustRankingV1 === true,
      },
      freshness: { generatedAt },
    });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
