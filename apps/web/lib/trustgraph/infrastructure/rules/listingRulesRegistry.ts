import type {
  BrokerVerificationRuleContext,
  FsboListingRuleContext,
  ListingRuleRunOptions,
  RuleEvaluationResult,
} from "@/lib/trustgraph/domain/types";
import { collectPhase6ListingRuleResults } from "@/lib/trustgraph/infrastructure/rules/phase6ListingRulesRegistry";
import { collectPhase8ListingRuleResults } from "@/lib/trustgraph/infrastructure/rules/phase8ListingRulesRegistry";
import { evaluateAddressRequiredFieldsRule } from "@/lib/trustgraph/infrastructure/rules/addressRequiredFieldsRule";
import { evaluateCondoUnitRequiredRule } from "@/lib/trustgraph/infrastructure/rules/condoUnitRequiredRule";
import { evaluatePropertyTypeMetadataMatchRule } from "@/lib/trustgraph/infrastructure/rules/propertyTypeMetadataMatchRule";
import { evaluateListingTextTypeMatchRule } from "@/lib/trustgraph/infrastructure/rules/listingTextTypeMatchRule";
import { evaluatePhotoMinimumRule } from "@/lib/trustgraph/infrastructure/rules/photoMinimumRule";
import { evaluateExteriorFrontRequiredRule } from "@/lib/trustgraph/infrastructure/rules/exteriorFrontRequiredRule";
import { evaluateFreePlanPhotoLimitRule } from "@/lib/trustgraph/infrastructure/rules/freePlanPhotoLimitRule";
import { evaluateDuplicateMediaHashRule } from "@/lib/trustgraph/infrastructure/rules/duplicateMediaHashRule";
import { evaluateSuspiciousPriceRule } from "@/lib/trustgraph/infrastructure/rules/suspiciousPriceRule";
import { evaluateDeclarationRequiredSectionsRule } from "@/lib/trustgraph/infrastructure/rules/declarationRequiredSectionsRule";
import { evaluateDeclarationContradictionRule } from "@/lib/trustgraph/infrastructure/rules/declarationContradictionRule";
import { evaluateDeclarationMandatoryFieldsRule } from "@/lib/trustgraph/infrastructure/rules/declarationMandatoryFieldsRule";
import { evaluateBrokerLicensePresentRule } from "@/lib/trustgraph/infrastructure/rules/brokerLicensePresentRule";
import { evaluateBrokerContactCompletenessRule } from "@/lib/trustgraph/infrastructure/rules/brokerContactCompletenessRule";
import { evaluateBrokerageInfoPresentRule } from "@/lib/trustgraph/infrastructure/rules/brokerageInfoPresentRule";

export type { ListingRuleRunOptions };

/**
 * Phase 2 FSBO listing + seller declaration rules (deterministic, ordered).
 */
export function collectFsboListingRuleResults(
  ctx: FsboListingRuleContext,
  opts: ListingRuleRunOptions
): RuleEvaluationResult[] {
  return [
    evaluateAddressRequiredFieldsRule(ctx),
    evaluateCondoUnitRequiredRule(ctx),
    evaluatePropertyTypeMetadataMatchRule(ctx),
    evaluateListingTextTypeMatchRule(ctx),
    evaluatePhotoMinimumRule(ctx),
    evaluateExteriorFrontRequiredRule(ctx),
    evaluateFreePlanPhotoLimitRule(ctx),
    evaluateDuplicateMediaHashRule(ctx, {
      duplicateSha256AcrossOtherListings: opts.duplicateSha256AcrossOtherListings,
      duplicateSha256WithinListing: opts.duplicateSha256WithinListing,
      duplicateImageUrlsWithinListing: opts.duplicateImageUrlsWithinListing,
    }),
    evaluateSuspiciousPriceRule(ctx),
    evaluateDeclarationRequiredSectionsRule(ctx),
    evaluateDeclarationContradictionRule(ctx),
    evaluateDeclarationMandatoryFieldsRule(ctx),
    ...collectPhase6ListingRuleResults(ctx, opts),
    ...collectPhase8ListingRuleResults(ctx, opts),
  ];
}

export function collectBrokerVerificationResults(ctx: BrokerVerificationRuleContext): RuleEvaluationResult[] {
  return [
    evaluateBrokerLicensePresentRule(ctx),
    evaluateBrokerContactCompletenessRule(ctx),
    evaluateBrokerageInfoPresentRule(ctx),
  ];
}

export function collectSellerDeclarationOnlyResults(ctx: FsboListingRuleContext): RuleEvaluationResult[] {
  return [
    evaluateDeclarationRequiredSectionsRule(ctx),
    evaluateDeclarationContradictionRule(ctx),
    evaluateDeclarationMandatoryFieldsRule(ctx),
  ];
}
