import { brokerAiFlags } from "@/config/feature-flags";
import type { HubJourneyContext, HubKey } from "./hub-journey.types";

/**
 * Human-readable blockers for copilot + journey (deterministic; no side effects).
 */
export function detectHubBlockers(hub: HubKey, ctx: HubJourneyContext): string[] {
  const out: string[] = [];

  switch (hub) {
    case "buyer":
      if (!ctx.buyerCitySelected) out.push("Primary city or market not set on your profile.");
      if (!ctx.buyerBudgetSet && ctx.buyerCitySelected) out.push("No financing or budget signal yet — add a mortgage inquiry or set a range.");
      if ((ctx.buyerShortlistCount ?? 0) > 0 && !ctx.buyerContactedSeller) {
        out.push("You saved listings but have not contacted a seller yet.");
      }
      break;
    case "seller":
      if (!ctx.sellerListingStarted) out.push("No listing draft started.");
      if (ctx.sellerListingStarted && (ctx.sellerPhotosCount ?? 0) < 3) {
        out.push("Listing needs more photos before buyers trust the ad.");
      }
      if (ctx.sellerListingStarted && !ctx.sellerPublished) out.push("Listing is not published yet — visibility stays low.");
      if (
        brokerAiFlags.brokerAiCertificateOfLocationV2 &&
        ctx.sellerPublished &&
        ctx.sellerCertificateLocationSatisfied === false
      ) {
        out.push(
          "Certificate-of-location structured coverage is incomplete for at least one active listing — review uploads or optional certificate slot.",
        );
      }
      break;
    case "rent":
      if (!ctx.rentCriteriaSet) out.push("Search or rental intent not recorded yet — run a search or open listings.");
      if ((ctx.rentShortlistCount ?? 0) === 0 && ctx.rentCriteriaSet) {
        out.push("No applications or shortlist activity yet.");
      }
      break;
    case "landlord":
      if (!ctx.landlordPublished) out.push("No active long-term rental listing.");
      if (ctx.landlordPublished && (ctx.landlordLeadCount ?? 0) === 0) {
        out.push("Published, but no renter inquiries yet — check pricing and photos.");
      }
      break;
    case "bnhub_guest":
      if (!ctx.bnGuestBookingPaid && (ctx.bnGuestBookingStarted ?? false)) {
        out.push("Booking started but not completed — finish checkout to confirm.");
      }
      break;
    case "bnhub_host":
      if (!ctx.bnHostPublished) out.push("Stay is not published — guests cannot book.");
      if (ctx.bnHostPublished && ctx.bnHostLowConversion) {
        out.push("Listing is live but conversion looks weak — improve photos and amenities.");
      }
      if (ctx.bnHostPublished && (ctx.bnHostBookingCount ?? 0) === 0) {
        out.push("No bookings yet — review pricing and trust signals.");
      }
      break;
    case "broker":
      if (!ctx.brokerProfileComplete) out.push("Broker profile missing phone or display name.");
      if ((ctx.brokerLeadsUnlocked ?? 0) > 0 && (ctx.brokerLeadsContacted ?? 0) === 0) {
        out.push("Unlocked leads need a first touch — contact within minutes.");
      }
      if (
        brokerAiFlags.brokerAiCertificateOfLocationV2 &&
        (ctx.brokerLeadsUnlocked ?? 0) > 0 &&
        ctx.brokerCertificateLocationSatisfied === false
      ) {
        out.push(
          "Certificate workflow has no audited request/review entry yet — log an action when you engage certificate coverage.",
        );
      }
      break;
    case "investor":
      if (!ctx.investorGoalsSet) out.push("Investment goals not saved — set strategy and budget.");
      if (ctx.investorGoalsSet && (ctx.investorShortlistCount ?? 0) === 0) {
        out.push("No properties shortlisted for diligence.");
      }
      break;
    case "admin":
      break;
    default:
      break;
  }

  return out;
}
