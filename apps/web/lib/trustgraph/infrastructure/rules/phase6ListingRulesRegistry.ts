import type { FsboListingRuleContext, ListingRuleRunOptions, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { evaluateAddressGeocodeMatchRule } from "@/lib/trustgraph/infrastructure/rules/addressGeocodeMatchRule";
import { evaluateCrossListingMediaReuseRule } from "@/lib/trustgraph/infrastructure/rules/crossListingMediaReuseRule";
import { evaluateExteriorSceneConfidenceRule } from "@/lib/trustgraph/infrastructure/rules/exteriorSceneConfidenceRule";
import { evaluateExtractionDeclarationConsistencyRule } from "@/lib/trustgraph/infrastructure/rules/extractionDeclarationConsistencyRule";
import { evaluateLocationPrecisionConfidenceRule } from "@/lib/trustgraph/infrastructure/rules/locationPrecisionConfidenceRule";
import { evaluateMediaCategoryConsistencyRule } from "@/lib/trustgraph/infrastructure/rules/mediaCategoryConsistencyRule";
import { evaluatePhotoDocumentMismatchRule } from "@/lib/trustgraph/infrastructure/rules/photoDocumentMismatchRule";
import { evaluatePostalRegionConsistencyRule } from "@/lib/trustgraph/infrastructure/rules/postalRegionConsistencyRule";
import { evaluateRepeatedContactReuseRule } from "@/lib/trustgraph/infrastructure/rules/repeatedContactReuseRule";
import { evaluateRepeatedDocumentFingerprintRule } from "@/lib/trustgraph/infrastructure/rules/repeatedDocumentFingerprintRule";
import { evaluateStreetContextConfidenceRule } from "@/lib/trustgraph/infrastructure/rules/streetContextConfidenceRule";
import { evaluateStreetEvidencePresenceRule } from "@/lib/trustgraph/infrastructure/rules/streetEvidencePresenceRule";
import { evaluateSuspiciousEntityLinkDensityRule } from "@/lib/trustgraph/infrastructure/rules/suspiciousEntityLinkDensityRule";

export function collectPhase6ListingRuleResults(
  ctx: FsboListingRuleContext,
  opts: ListingRuleRunOptions
): RuleEvaluationResult[] {
  if (!ctx.phase6?.enabled) {
    return [];
  }
  return [
    evaluateAddressGeocodeMatchRule(ctx),
    evaluatePostalRegionConsistencyRule(ctx),
    evaluateStreetEvidencePresenceRule(ctx),
    evaluateLocationPrecisionConfidenceRule(ctx),
    evaluateExteriorSceneConfidenceRule(ctx),
    evaluateStreetContextConfidenceRule(ctx),
    evaluatePhotoDocumentMismatchRule(ctx),
    evaluateMediaCategoryConsistencyRule(ctx),
    evaluateCrossListingMediaReuseRule(ctx, opts),
    evaluateRepeatedContactReuseRule(ctx),
    evaluateRepeatedDocumentFingerprintRule(ctx),
    evaluateSuspiciousEntityLinkDensityRule(ctx),
    evaluateExtractionDeclarationConsistencyRule(ctx),
  ];
}
