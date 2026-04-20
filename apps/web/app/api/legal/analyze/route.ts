import { NextRequest, NextResponse } from "next/server";
import type { LegalRiskEngineInput } from "@/modules/legal/engine/legal-engine.service";
import type { LegalEvaluationInput } from "@/modules/legal/legal-evaluation.types";
import {
  evaluateLegalCompliance,
  persistLegalComplianceArtifacts,
  syncPropertyAndSellerProfiles,
} from "@/modules/legal/legal-orchestration.service";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function parseBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  return undefined;
}

function normalizeEnginePartial(body: Record<string, unknown>): Partial<LegalRiskEngineInput> {
  const listing = typeof body.listing === "object" && body.listing !== null ? (body.listing as Record<string, unknown>) : {};
  const seller = typeof body.seller === "object" && body.seller !== null ? (body.seller as Record<string, unknown>) : {};
  const inspection = typeof body.inspection === "object" && body.inspection !== null ? (body.inspection as Record<string, unknown>) : {};

  const raw: Partial<LegalRiskEngineInput> = {
    roofConditionUnknown: parseBool(listing.roofConditionUnknown),
    highValueProperty: parseBool(listing.highValueProperty),
    sellerProvidedInfo: parseBool(seller.sellerProvidedInfo ?? seller.providedInfo),
    incompleteDisclosure: parseBool(seller.incompleteDisclosure),
    inspectionLimited: parseBool(inspection.limited ?? inspection.inspectionLimited),
    sellerSilenceDuringInspection: parseBool(inspection.sellerSilenceDuringInspection ?? inspection.sellerSilence),
    brokerDisclosedSource: parseBool(seller.brokerDisclosedSource),
    attemptedVerification: parseBool(seller.attemptedVerification),
    knownDefect: parseBool(seller.knownDefect),
    notDisclosed: parseBool(seller.notDisclosed),
    hiddenDefect: parseBool(listing.hiddenDefect),
    serious: parseBool(listing.serious),
    priorToSale: parseBool(listing.priorToSale),
  };
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined)) as Partial<LegalRiskEngineInput>;
}

export async function POST(request: NextRequest) {
  try {
    let raw: Record<string, unknown> = {};
    try {
      raw = (await request.json()) as Record<string, unknown>;
    } catch {
      raw = {};
    }

    const defaults: LegalRiskEngineInput = {
      roofConditionUnknown: false,
      highValueProperty: false,
      sellerProvidedInfo: false,
      incompleteDisclosure: false,
      inspectionLimited: false,
      sellerSilenceDuringInspection: false,
    };

    const brokerObj =
      typeof raw.broker === "object" && raw.broker !== null ? (raw.broker as Record<string, unknown>) : {};
    const fraudObj =
      typeof raw.sellerFraud === "object" && raw.sellerFraud !== null ? (raw.sellerFraud as Record<string, unknown>) : {};

    const evaluation: LegalEvaluationInput = {
      ...defaults,
      ...normalizeEnginePartial(raw),
      broker: {
        brokerDisclosedSource: parseBool(brokerObj.brokerDisclosedSource),
        attemptedVerification: parseBool(brokerObj.attemptedVerification),
        disclosureWarningIssued: parseBool(brokerObj.disclosureWarningIssued),
        sellerUncooperative: parseBool(brokerObj.sellerUncooperative),
        forwardedSellerInfoWithoutWarning: parseBool(brokerObj.forwardedSellerInfoWithoutWarning),
        forwardedWithoutVerificationAttempt: parseBool(brokerObj.forwardedWithoutVerificationAttempt),
      },
      sellerFraud: {
        listingDescription: typeof fraudObj.listingDescription === "string" ? fraudObj.listingDescription : "",
        sellerDeclarationJson: fraudObj.sellerDeclarationJson ?? null,
        inspectionNotes: typeof fraudObj.inspectionNotes === "string" ? fraudObj.inspectionNotes : null,
        uploadedDocCategories: Array.isArray(fraudObj.uploadedDocCategories)
          ? fraudObj.uploadedDocCategories.filter((x): x is string => typeof x === "string")
          : [],
        sameSellerHighRiskListingCount:
          typeof fraudObj.sameSellerHighRiskListingCount === "number"
            ? fraudObj.sameSellerHighRiskListingCount
            : undefined,
      },
    };

    const output = evaluateLegalCompliance(evaluation);

    const persist = request.nextUrl.searchParams.get("persist") === "true";
    const listingScope = request.nextUrl.searchParams.get("listingScope") === "BNHUB" ? "BNHUB" : "FSBO";
    const listingId = request.nextUrl.searchParams.get("listingId")?.trim();
    const sellerUserId = request.nextUrl.searchParams.get("sellerUserId")?.trim();

    const userId = await getGuestId();
    if (persist && listingId) {
      await syncPropertyAndSellerProfiles(output, {
        listingScope,
        listingId,
        sellerUserId: sellerUserId ?? null,
        persistAlerts: true,
        actorUserId: userId,
      });
      await persistLegalComplianceArtifacts(output, {
        listingScope,
        listingId,
        sellerUserId: sellerUserId ?? null,
        persistAlerts: true,
        actorUserId: userId,
      });
    }

    return NextResponse.json({ evaluation: output });
  } catch (e) {
    console.error("POST /api/legal/analyze", e);
    return NextResponse.json(
      {
        error: "Analysis failed",
        evaluation: evaluateLegalCompliance({}),
      },
      { status: 200 },
    );
  }
}
