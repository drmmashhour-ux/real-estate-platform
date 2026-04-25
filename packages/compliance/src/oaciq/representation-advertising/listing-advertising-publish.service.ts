import { DEFAULT_PUBLISH_RULE_SUBSET } from "@/lib/compliance/oaciq/representation-advertising/rules";
import { buildListingAdvertisingComplianceContext } from "@/lib/compliance/oaciq/representation-advertising/context-builder";
import { validateListingAdvertisingCompliance } from "@/lib/compliance/oaciq/representation-advertising/engine";
import type { RepresentationAdvertisingEvaluation } from "@/lib/compliance/oaciq/representation-advertising/types";

export type ListingAdvertisingPublishValidation = RepresentationAdvertisingEvaluation;

/**
 * Full gate for CRM marketplace publish — OACIQ representation / advertising layer.
 */
export async function validateListingAdvertisingForPublish(
  listingId: string,
  brokerUserId: string,
): Promise<ListingAdvertisingPublishValidation> {
  const ctx = await buildListingAdvertisingComplianceContext(listingId, brokerUserId, {
    intendedForPublicAdvertising: true,
  });
  return validateListingAdvertisingCompliance(ctx, DEFAULT_PUBLISH_RULE_SUBSET);
}
