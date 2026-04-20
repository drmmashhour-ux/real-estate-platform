/**
 * Combines engine + broker + seller fraud analysis; optional persistence for HIGH/CRITICAL paths.
 */

import type { LegalRiskEngineInput } from "./engine/legal-engine.service";
import { evaluateLegalRisk } from "./engine/legal-engine.service";
import { evaluateBrokerProtection, type BrokerEvaluationInput } from "./legal-rules.service";
import { analyzeSellerDisclosureFraud } from "./legal-fraud.service";
import {
  buildRecommendedActions,
  LEGAL_COMPLIANCE_WARNING_INSPECTION,
  LEGAL_COMPLIANCE_WARNING_PRIMARY,
} from "./legal-recommended-actions";
import type { LegalEvaluationInput, LegalEvaluationOutput, PersistLegalEvaluationOptions } from "./legal-evaluation.types";
import { prisma } from "@/lib/db";
import { insertLegalRiskEventSafe } from "./repositories/legal-risk-event.repository";
import { insertLegalAlertSafe } from "./repositories/legal-alert.repository";
import { upsertPropertyLegalProfileSafe } from "./repositories/property-legal-profile.repository";
import { upsertSellerDisclosureProfileSafe } from "./repositories/seller-disclosure-profile.repository";
import { logLegalAction } from "./legal-audit.service";
import { legalEngineLog } from "./legal-logging";

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function riskLevelFromScore(score: number): LegalEvaluationOutput["overallRiskLevel"] {
  if (score > 80) return "CRITICAL";
  if (score > 50) return "HIGH";
  return "MEDIUM";
}

async function countFsboHighRiskPeers(ownerId: string, excludeListingId?: string): Promise<number> {
  try {
    const listings = await prisma.fsboListing.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const ids = listings.map((l) => l.id).filter((id) => id !== excludeListingId);
    if (!ids.length) return 0;
    const n = await prisma.propertyLegalProfile.count({
      where: {
        listingScope: "FSBO",
        listingId: { in: ids },
        overallLegalRiskScore: { gte: 51 },
      },
    });
    return n;
  } catch {
    return 0;
  }
}

export function evaluateLegalCompliance(input: LegalEvaluationInput): LegalEvaluationOutput {
  const brokerIn: BrokerEvaluationInput = {
    brokerDisclosedSource: input.broker?.brokerDisclosedSource ?? input.brokerDisclosedSource ?? false,
    attemptedVerification: input.broker?.attemptedVerification ?? input.attemptedVerification ?? false,
    disclosureWarningIssued: input.broker?.disclosureWarningIssued ?? false,
    sellerUncooperative: input.broker?.sellerUncooperative ?? false,
    forwardedSellerInfoWithoutWarning: input.broker?.forwardedSellerInfoWithoutWarning ?? false,
    forwardedWithoutVerificationAttempt: input.broker?.forwardedWithoutVerificationAttempt ?? false,
  };

  const fraudIn = input.sellerFraud ?? {};
  const fraud = analyzeSellerDisclosureFraud({
    listingDescription: fraudIn.listingDescription ?? "",
    sellerDeclarationJson: fraudIn.sellerDeclarationJson ?? null,
    inspectionNotes: fraudIn.inspectionNotes ?? null,
    uploadedDocCategories: fraudIn.uploadedDocCategories ?? [],
    sameSellerHighRiskListingCount: fraudIn.sameSellerHighRiskListingCount ?? 0,
  });

  const engineIn: LegalRiskEngineInput = {
    roofConditionUnknown: input.roofConditionUnknown,
    highValueProperty: input.highValueProperty,
    sellerProvidedInfo: input.sellerProvidedInfo,
    incompleteDisclosure: input.incompleteDisclosure,
    inspectionLimited: input.inspectionLimited,
    sellerSilenceDuringInspection: input.sellerSilenceDuringInspection ?? fraud.silenceDuringInspection,
    brokerDisclosedSource: input.brokerDisclosedSource ?? brokerIn.brokerDisclosedSource,
    attemptedVerification: input.attemptedVerification ?? brokerIn.attemptedVerification,
    knownDefect: input.knownDefect ?? fraud.knownDefectNotDisclosed,
    notDisclosed: input.notDisclosed ?? fraud.knownDefectNotDisclosed,
    hiddenDefect: input.hiddenDefect,
    serious: input.serious,
    priorToSale: input.priorToSale,
  };

  const engine = evaluateLegalRisk(engineIn);
  const broker = evaluateBrokerProtection(brokerIn);

  const overallScore = clampScore(
    engine.score * 0.42 + fraud.misrepresentationDelta * 0.38 + broker.brokerRiskScore * 0.2,
  );
  const overallRiskLevel = riskLevelFromScore(overallScore);

  const mergedFlags = [...engine.flags, ...fraud.signals];
  const recommendedActions = buildRecommendedActions(mergedFlags, overallRiskLevel);

  const complianceWarnings: string[] = [];
  if (overallRiskLevel === "HIGH" || overallRiskLevel === "CRITICAL") {
    complianceWarnings.push(LEGAL_COMPLIANCE_WARNING_PRIMARY);
  }
  if (engine.flags.includes("INSPECTION_LIMITATION")) {
    complianceWarnings.push(LEGAL_COMPLIANCE_WARNING_INSPECTION);
  }

  return {
    engine,
    broker,
    sellerFraud: fraud,
    overallScore,
    overallRiskLevel,
    recommendedActions,
    complianceWarnings,
  };
}

export async function syncPropertyAndSellerProfiles(
  output: LegalEvaluationOutput,
  opts: PersistLegalEvaluationOptions,
): Promise<void> {
  try {
    await upsertPropertyLegalProfileSafe({
      listingScope: opts.listingScope,
      listingId: opts.listingId,
      latentDefectRiskScore: output.engine.latentDefectIndicated ? output.engine.score : output.engine.score * 0.15,
      disclosureRiskScore: output.engine.flags.includes("MISREPRESENTATION_RISK") ? output.overallScore : output.overallScore * 0.35,
      fraudRiskScore: output.sellerFraud.misrepresentationDelta,
      overallLegalRiskScore: output.overallScore,
      latestRiskLevel: output.overallRiskLevel,
      signals: {
        flags: [...output.engine.flags, ...output.sellerFraud.signals],
        brokerProtected: output.broker.brokerProtected,
      },
    });

    if (opts.sellerUserId) {
      let prevScore = 0;
      let prevRec = 0;
      try {
        const row = await prisma.sellerDisclosureProfile.findUnique({
          where: { sellerUserId: opts.sellerUserId },
          select: { misrepresentationScore: true, recurringPatternCount: true },
        });
        prevScore = row?.misrepresentationScore ?? 0;
        prevRec = row?.recurringPatternCount ?? 0;
      } catch {
        prevScore = 0;
        prevRec = 0;
      }
      await upsertSellerDisclosureProfileSafe({
        sellerUserId: opts.sellerUserId,
        misrepresentationScore: Math.min(100, prevScore + output.sellerFraud.misrepresentationDelta * 0.35),
        recurringPatternCount: output.sellerFraud.recurringPattern ? Math.max(prevRec, 2) : prevRec,
        signals: { lastFlags: output.sellerFraud.signals },
      });
    }
  } catch (e) {
    legalEngineLog("syncPropertyAndSellerProfiles failed", { error: String(e) });
  }
}

export async function persistLegalComplianceArtifacts(
  output: LegalEvaluationOutput,
  opts: PersistLegalEvaluationOptions,
): Promise<void> {
  if (!opts.persistAlerts) return;
  if (output.overallRiskLevel !== "HIGH" && output.overallRiskLevel !== "CRITICAL") return;

  try {
    await insertLegalRiskEventSafe({
      entityType: opts.listingScope === "FSBO" ? "LISTING_FSBO" : "LISTING_BNHUB",
      entityId: opts.listingId,
      riskType: "LEGAL_COMPLIANCE",
      score: output.overallScore,
      flags: [...output.engine.flags, ...output.sellerFraud.signals],
      explanation: `${output.broker.reasoning} | Actions: ${output.recommendedActions.join("; ")}`,
    });

    await insertLegalAlertSafe({
      entityType: opts.listingScope === "FSBO" ? "LISTING_FSBO" : "LISTING_BNHUB",
      entityId: opts.listingId,
      riskLevel: output.overallRiskLevel,
      title: "Legal compliance review",
      detail: output.complianceWarnings.join(" ") || "Elevated legal risk score.",
      signals: {
        overallScore: output.overallScore,
        recommendedActions: output.recommendedActions,
      },
    });

    await logLegalAction({
      entityType: "LEGAL_COMPLIANCE",
      entityId: opts.listingId,
      action: "EVALUATION_HIGH_RISK",
      actorId: opts.actorUserId ?? null,
      actorType: opts.actorUserId ? "USER" : "SYSTEM",
      metadata: {
        overallScore: output.overallScore,
        overallRiskLevel: output.overallRiskLevel,
        flags: output.engine.flags,
      },
    });
  } catch (e) {
    legalEngineLog("persistLegalComplianceArtifacts failed", { error: String(e) });
  }
}

export async function evaluateAndPersistFsboListing(
  listingId: string,
  actorUserId: string | null,
  persist: boolean,
): Promise<LegalEvaluationOutput> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      title: true,
      description: true,
      priceCents: true,
      surfaceSqft: true,
      status: true,
      ownerId: true,
      sellerDeclarationJson: true,
    },
  });

  const peerHigh = listing ? await countFsboHighRiskPeers(listing.ownerId, listingId) : 0;

  const base = listing
    ? ({
        roofConditionUnknown:
          !/\b(roof|toiture|toit)\b/i.test(`${listing.title}\n${listing.description}`) &&
          (listing.surfaceSqft != null ? listing.surfaceSqft > 1200 : false),
        highValueProperty: listing.priceCents >= 50_000_000,
        sellerProvidedInfo: `${listing.title}\n${listing.description}`.length > 20,
        incompleteDisclosure:
          listing.description.includes("Complete your listing in Seller Hub") || listing.description.length < 80,
        inspectionLimited: listing.status === "DRAFT",
        sellerFraud: {
          listingDescription: `${listing.title}\n${listing.description}`,
          sellerDeclarationJson: listing.sellerDeclarationJson,
          inspectionNotes: null,
          uploadedDocCategories: [],
          sameSellerHighRiskListingCount: peerHigh,
        },
      } satisfies LegalEvaluationInput)
    : ({} as LegalEvaluationInput);

  const output = evaluateLegalCompliance(base);
  await syncPropertyAndSellerProfiles(output, {
    listingScope: "FSBO",
    listingId,
    sellerUserId: listing?.ownerId ?? null,
    persistAlerts: true,
    actorUserId,
  });
  if (persist) {
    await persistLegalComplianceArtifacts(output, {
      listingScope: "FSBO",
      listingId,
      sellerUserId: listing?.ownerId ?? null,
      persistAlerts: true,
      actorUserId,
    });
  }
  return output;
}
