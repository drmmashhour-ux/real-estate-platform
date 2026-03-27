import { validateForms, type LegalActionContext } from "@/modules/legal/legal-engine";
export {
  validateLegalReadiness,
  getRequiredLegalSteps,
  getRequiredContracts,
  getRequiredDisclosures,
  getRequiredDocuments,
  loadComplianceSnapshotForRules,
  mapRulesToAction,
  type LegalRulesContext,
  type LegalStep,
  type LegalDocumentRef,
  type LegalDisclosureRef,
} from "@/modules/legal/rules";
import {
  buildComplianceSnapshotForBnhubLongPublish,
  buildComplianceSnapshotForBnhubShortPublish,
  buildComplianceSnapshotForBroker,
  buildComplianceSnapshotForBuyerHub,
  buildComplianceSnapshotForFsboSeller,
  buildComplianceSnapshotForMortgageHub,
} from "@/modules/legal/legal-snapshot";

export async function assertBuyerContactAllowed(userId: string, fsboListingId: string) {
  const snap = await buildComplianceSnapshotForBuyerHub(userId);
  return validateForms({ context: "buyer_contact", fsboListingId }, snap);
}

export async function assertBuyerOfferAllowed(userId: string, listingId: string) {
  const snap = await buildComplianceSnapshotForBuyerHub(userId);
  return validateForms({ context: "buyer_offer", listingId }, snap);
}

export async function assertMortgageRequestAllowed(userId: string) {
  const snap = await buildComplianceSnapshotForMortgageHub(userId);
  return validateForms({ context: "mortgage_request" }, snap);
}

export async function assertBrokerLeadAccessAllowed(userId: string) {
  const snap = await buildComplianceSnapshotForBroker(userId);
  return validateForms({ context: "broker_activity" }, snap);
}

export async function assertSellerListingActivation(userId: string, fsboListingId: string) {
  const snap = await buildComplianceSnapshotForFsboSeller(userId, fsboListingId);
  return validateForms({ context: "seller_listing", fsboListingId }, snap);
}

export async function assertGuestShortTermBookingAllowed(userId: string, listingId: string) {
  const snap = await buildComplianceSnapshotForBuyerHub(userId);
  return validateForms({ context: "rental_short_booking", listingId }, snap);
}

export async function assertLegalAction(action: LegalActionContext, userId: string) {
  switch (action.context) {
    case "seller_listing":
      return validateForms(action, await buildComplianceSnapshotForFsboSeller(userId, action.fsboListingId));
    case "broker_activity":
      return validateForms(action, await buildComplianceSnapshotForBroker(userId));
    case "mortgage_request":
      return validateForms(action, await buildComplianceSnapshotForMortgageHub(userId));
    case "buyer_contact":
    case "buyer_offer":
      return validateForms(action, await buildComplianceSnapshotForBuyerHub(userId));
    case "rental_short_publish":
      return validateForms(action, await buildComplianceSnapshotForBnhubShortPublish(action.listingId));
    case "rental_long":
      return validateForms(action, await buildComplianceSnapshotForBnhubLongPublish(action.listingId));
    case "rental_short_booking":
    case "tenant_confirmation":
      return validateForms(action, await buildComplianceSnapshotForBuyerHub(userId));
  }
}
