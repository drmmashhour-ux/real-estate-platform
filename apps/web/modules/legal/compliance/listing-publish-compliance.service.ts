/**
 * FSBO publish — Québec compliance gate (loads DB context; no writes).
 */

import { prisma } from "@/lib/db";
import { complianceFlags } from "@/config/feature-flags";
import { getLegalIntelligenceBundle } from "@/modules/legal/legal-intelligence.service";
import { normalizeLegalFraudIndicators } from "@/modules/legal/legal-fraud-engine.service";
import {
  buildListingComplianceDecision,
  evaluateListingComplianceBundle,
} from "./listing-compliance-decision.service";
import type {
  ListingComplianceDecision,
  ListingQuebecCompliancePreview,
  QuebecComplianceChecklistResult,
} from "./quebec-compliance.types";
import type { QuebecComplianceDomain } from "./quebec-compliance.types";
import type { QuebecComplianceEvaluatorInput } from "./quebec-compliance-evaluator.service";
import type { LegalRecordValidationBundleV1 } from "../records/legal-record.types";

export function shouldApplyQuebecComplianceForListing(params: {
  country?: string | null;
  region?: string | null;
}): boolean {
  if (String(params.country ?? "").toUpperCase() !== "CA") return false;
  const r = (params.region ?? "").trim().toUpperCase();
  if (r === "" || r === "QC" || r === "QUÉBEC" || r === "QUEBEC") return true;
  return false;
}

export function resolveDomainsForListing(listing: {
  listingOwnerType?: string | null;
  listingDealType?: string | null;
}): QuebecComplianceDomain[] {
    const d = new Set<QuebecComplianceDomain>(["listing", "seller"]);
  if (listing.listingOwnerType === "BROKER") {
    d.add("broker");
  }
  const deal = (listing.listingDealType ?? "SALE").toUpperCase();
  if (deal.includes("RENT") || deal.includes("LEASE")) {
    d.add("landlord");
  }
  if (deal.includes("SHORT") || deal.includes("BNHUB") || deal.includes("STAY")) {
    d.add("short_term_rental");
  }
  return [...d].sort();
}

/** Map verification enum to evaluator string */
export async function loadQuebecComplianceEvaluatorInput(listingId: string): Promise<QuebecComplianceEvaluatorInput | null> {
  try {
    const listing = await prisma.fsboListing.findUnique({
      where: { id: listingId },
      select: {
        country: true,
        region: true,
        priceCents: true,
        propertyType: true,
        address: true,
        city: true,
        listingOwnerType: true,
        listingDealType: true,
        sellerDeclarationJson: true,
        sellerDeclarationCompletedAt: true,
        legalAccuracyAcceptedAt: true,
        moderationStatus: true,
        tenantId: true,
        listingCode: true,
        documents: { select: { docType: true, status: true } },
        verification: {
          select: {
            identityStatus: true,
          },
        },
        owner: {
          select: {
            brokerVerifications: {
              orderBy: { updatedAt: "desc" },
              take: 1,
              select: { verificationStatus: true },
            },
          },
        },
      },
    });
    if (!listing) return null;

    const lrRows =
      complianceFlags.quebecComplianceV1 ?
        await prisma.legalRecord.findMany({
          where: { entityType: "fsbo_listing", entityId: listingId },
          select: { recordType: true, status: true, parsedData: true, validation: true },
          take: 80,
        })
      : [];

    const legalRecords = lrRows.map((r) => ({
      recordType: r.recordType,
      status: r.status,
      parsedData: r.parsedData && typeof r.parsedData === "object" ? (r.parsedData as Record<string, unknown>) : null,
      validation:
        r.validation && typeof r.validation === "object" ?
          (r.validation as LegalRecordValidationBundleV1)
        : null,
    }));

    let validationAggregate = null;
    try {
      const merged: { missing: string[]; inconsistent: string[] } = { missing: [], inconsistent: [] };
      for (const x of legalRecords) {
        const v = x.validation?.validation;
        if (v) {
          merged.missing.push(...(v.missingFields ?? []));
          merged.inconsistent.push(...(v.inconsistentFields ?? []));
        }
      }
      validationAggregate = {
        isValid: merged.missing.length === 0 && merged.inconsistent.length === 0,
        missingFields: [...new Set(merged.missing)],
        inconsistentFields: [...new Set(merged.inconsistent)],
        warnings: [],
      };
    } catch {
      validationAggregate = null;
    }

    let ruleResults = null;
    try {
      const rules = legalRecords.flatMap((x) => x.validation?.rules ?? []);
      ruleResults = rules.length ? rules : null;
    } catch {
      ruleResults = null;
    }

    let legalIntelCriticalCount = 0;
    let legalIntelWarningCount = 0;
    let fraudIndicators = null;
    if (complianceFlags.quebecComplianceV1) {
      try {
        const bundle = await getLegalIntelligenceBundle({
          entityType: "fsbo_listing",
          entityId: listingId,
          actorType: "seller",
          workflowType: "qc_compliance_gate",
        });
        legalIntelCriticalCount = bundle.summary.countsBySeverity.critical;
        legalIntelWarningCount = bundle.summary.countsBySeverity.warning;
        fraudIndicators = normalizeLegalFraudIndicators(bundle.signals);
      } catch {
        legalIntelCriticalCount = 0;
        legalIntelWarningCount = 0;
        fraudIndicators = [];
      }
    }

    let documentRejectionLoop = false;
    try {
      const rejDocs = listing.documents.filter((d) => d.status === "rejected").length;
      documentRejectionLoop = rejDocs >= 2;
    } catch {
      documentRejectionLoop = false;
    }

    const ownershipDoc = listing.documents.find((d) => d.docType === "ownership");
    const idProofDoc = listing.documents.find((d) => d.docType === "id_proof");

    const brokerLicenseVerified =
      listing.owner?.brokerVerifications?.[0]?.verificationStatus === "VERIFIED";

    const domains = resolveDomainsForListing(listing);

    return {
      primaryDomain: "listing",
      domains,
      listing: {
        id: listingId,
        country: listing.country,
        region: listing.region,
        priceCents: listing.priceCents,
        propertyType: listing.propertyType,
        address: listing.address,
        city: listing.city,
        listingOwnerType: listing.listingOwnerType,
        listingDealType: listing.listingDealType,
        sellerDeclarationJson: listing.sellerDeclarationJson,
        sellerDeclarationCompletedAt: listing.sellerDeclarationCompletedAt,
        legalAccuracyAcceptedAt: listing.legalAccuracyAcceptedAt,
        moderationStatus: listing.moderationStatus,
        ownershipDocStatus: ownershipDoc?.status ?? null,
        idProofDocStatus: idProofDoc?.status ?? null,
        verificationIdentityStage: listing.verification?.identityStatus ?? undefined,
      },
      legalRecords,
      validationAggregate,
      ruleResults,
      fraudIndicators: fraudIndicators ?? undefined,
      legalIntelCriticalCount,
      legalIntelWarningCount,
      brokerLicenseVerified,
      tenantIdPresent: Boolean(listing.tenantId),
      listingCodePresent: Boolean(listing.listingCode?.trim()),
      documentRejectionLoop,
    };
  } catch {
    return null;
  }
}

/** Admin / preview — deterministic bundle without duplicate evaluation when input is loaded once. */
export async function getQuebecComplianceAdminView(listingId: string): Promise<{
  checklist: QuebecComplianceChecklistResult | null;
  decision: ListingComplianceDecision | null;
  flags: { quebecComplianceV1: boolean; complianceAutoBlockV1: boolean };
}> {
  try {
    const flags = {
      quebecComplianceV1: complianceFlags.quebecComplianceV1 === true,
      complianceAutoBlockV1: complianceFlags.complianceAutoBlockV1 === true,
    };
    if (!complianceFlags.quebecComplianceV1) {
      return { checklist: null, decision: null, flags };
    }
    const inp = await loadQuebecComplianceEvaluatorInput(listingId);
    if (!inp) {
      return { checklist: null, decision: null, flags };
    }
    const bundle = evaluateListingComplianceBundle({ listingId, evaluatorInput: inp });
    return { checklist: bundle.checklist, decision: bundle.decision, flags };
  } catch {
    return {
      checklist: null,
      decision: null,
      flags: {
        quebecComplianceV1: complianceFlags.quebecComplianceV1 === true,
        complianceAutoBlockV1: complianceFlags.complianceAutoBlockV1 === true,
      },
    };
  }
}

/** Marketplace preview — read-only; respects FEATURE_QUEBEC_COMPLIANCE_V1 only (not auto-block). */
export async function buildListingQuebecCompliancePreview(listingId: string): Promise<ListingQuebecCompliancePreview | null> {
  try {
    if (!complianceFlags.quebecComplianceV1) return null;
    const inp = await loadQuebecComplianceEvaluatorInput(listingId);
    if (!inp) return null;
    if (!shouldApplyQuebecComplianceForListing({ country: inp.listing.country, region: inp.listing.region })) {
      return {
        featureEnabled: true,
        appliesToJurisdiction: false,
        readinessScore: 100,
        allowed: true,
        blockingIssueIds: [],
        userSafeReasons: [],
        checklistSummary: [],
      };
    }
    const bundle = evaluateListingComplianceBundle({ listingId, evaluatorInput: inp });
    const cl = bundle.checklist;
    if (!cl) return null;

    const checklistSummary = cl.items.map((item) => {
      const res = cl.results.find((r) => r.itemId === item.id);
      return {
        itemId: item.id,
        passed: res?.passed ?? false,
        label: item.label,
        severity: item.severity,
        blocking: item.blocking,
      };
    });

    return {
      featureEnabled: true,
      appliesToJurisdiction: true,
      readinessScore: bundle.decision.readinessScore,
      allowed: bundle.decision.allowed,
      blockingIssueIds: bundle.decision.blockingIssues,
      userSafeReasons: bundle.decision.reasons,
      checklistSummary,
    };
  } catch {
    return null;
  }
}

export async function evaluateListingPublishComplianceDecision(
  listingId: string,
): Promise<{ apply: boolean; decision: ListingComplianceDecision }> {
  try {
    if (!complianceFlags.quebecComplianceV1) {
      return {
        apply: false,
        decision: {
          listingId,
          allowed: true,
          reasons: [],
          blockingIssues: [],
          readinessScore: 100,
        },
      };
    }

    const inp = await loadQuebecComplianceEvaluatorInput(listingId);
    if (!inp) {
      return {
        apply: true,
        decision: {
          listingId,
          allowed: false,
          reasons: ["Listing could not be loaded for compliance review — verification required."],
          blockingIssues: ["qc_load_failed"],
          readinessScore: 0,
        },
      };
    }

    const listingCountry = inp.listing.country ?? "";
    const listingRegion = inp.listing.region ?? "";
    if (!shouldApplyQuebecComplianceForListing({ country: listingCountry, region: listingRegion })) {
      return {
        apply: false,
        decision: {
          listingId,
          allowed: true,
          reasons: [],
          blockingIssues: [],
          readinessScore: 100,
        },
      };
    }

    const decision = buildListingComplianceDecision({ listingId, evaluatorInput: inp });
    return { apply: true, decision };
  } catch {
    return {
      apply: true,
      decision: {
        listingId,
        allowed: false,
        reasons: ["Compliance evaluation requires verification — publishing is paused."],
        blockingIssues: ["qc_gate_fallback"],
        readinessScore: 0,
      },
    };
  }
}
