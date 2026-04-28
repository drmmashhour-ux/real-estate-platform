import { prisma } from "@/lib/db";
import { sybnbConfig } from "@/config/sybnb.config";
import type { SyriaAppUser, SyriaBooking, SyriaProperty } from "@/generated/prisma";
import { locationPhoneStateMismatchPoints } from "@/lib/sy8/sy8-phone-inferred-region";

export type SybnbPaymentRiskLevel = "ok" | "block" | "review";

function hostUnverifiedForRisk(owner: SyriaAppUser): boolean {
  return !owner.phoneVerifiedAt && !owner.verifiedAt;
}

async function countReportsForProperty(propertyId: string): Promise<number> {
  const [s1, s2] = await Promise.all([
    prisma.syriaListingReport.count({ where: { propertyId } }),
    prisma.listingReport.count({ where: { listingId: propertyId } }),
  ]);
  return s1 + s2;
}

async function countReportsForSeller(ownerId: string): Promise<number> {
  const props = await prisma.syriaProperty.findMany({
    where: { ownerId },
    select: { id: true },
  });
  if (props.length === 0) return 0;
  const ids = props.map((p) => p.id);
  const [s1, s2] = await Promise.all([
    prisma.syriaListingReport.count({ where: { propertyId: { in: ids } } }),
    prisma.listingReport.count({ where: { listingId: { in: ids } } }),
  ]);
  return s1 + s2;
}

export type SybnbPaymentRiskOutcome =
  | { level: "ok" }
  | { level: "block"; codes: string[]; detail: string }
  | { level: "review"; codes: string[]; detail: string };

/**
 * SYBNB card-payment risk: **block** (no charge) vs **review** (no automatic capture until ops / policy).
 * Does not replace technical checks (amounts, state machine) — run after listing is a stay and booking row exists.
 */
export async function evaluateSybnbPaymentRisk(input: {
  booking: Pick<SyriaBooking, "riskStatus" | "fraudFlag" | "createdAt" | "guestId">;
  property: Pick<
    SyriaProperty,
    | "id"
    | "status"
    | "fraudFlag"
    | "updatedAt"
    | "category"
    | "sybnbReview"
    | "needsReview"
    | "ownerId"
    | "area"
    | "addressDetails"
    | "state"
    | "governorate"
  >;
  owner: SyriaAppUser;
  now?: Date;
}): Promise<SybnbPaymentRiskOutcome> {
  const now = input.now ?? new Date();
  const { booking, property, owner } = input;
  const blockCodes: string[] = [];

  if (owner.flagged) {
    blockCodes.push("seller_flagged");
  }
  if (property.status !== "PUBLISHED") {
    blockCodes.push("listing_not_published");
  }
  if (property.fraudFlag) {
    blockCodes.push("listing_fraud");
  }
  if (input.booking.fraudFlag) {
    blockCodes.push("booking_fraud");
  }
  if (booking.riskStatus === "blocked") {
    blockCodes.push("booking_risk_blocked");
  }
  if (blockCodes.length > 0) {
    return {
      level: "block",
      codes: blockCodes,
      detail: `Payment blocked: ${blockCodes.join(", ")}`,
    };
  }

  if (booking.riskStatus === "review") {
    return {
      level: "review",
      codes: ["booking_risk_status_review"],
      detail: "Booking flagged for review — no automatic card capture",
    };
  }

  const [listingReports, sellerReports] = await Promise.all([
    countReportsForProperty(property.id),
    countReportsForSeller(property.ownerId),
  ]);

  const propertyEditedAfterRequest = property.updatedAt.getTime() > booking.createdAt.getTime();
  const contactEditedAfterRequest = owner.updatedAt.getTime() > booking.createdAt.getTime();
  const listingRecentlyTouched = now.getTime() - property.updatedAt.getTime() < sybnbConfig.recentChangeRiskWindowMs;
  const profileRecentlyTouched = now.getTime() - owner.updatedAt.getTime() < sybnbConfig.recentChangeRiskWindowMs;

  const reviewCodes: string[] = [];
  if (!property.area?.trim()) {
    reviewCodes.push("location_area_missing");
  }
  if (!property.addressDetails?.trim()) {
    reviewCodes.push("location_address_missing");
  }
  if (
    locationPhoneStateMismatchPoints({
      propertyState: property.state,
      propertyGovernorate: property.governorate,
      ownerPhone: owner.phone,
    }) > 0
  ) {
    reviewCodes.push("location_phone_state_mismatch");
  }
  if (hostUnverifiedForRisk(owner)) {
    reviewCodes.push("seller_unverified");
  }
  if (listingReports >= sybnbConfig.reviewPaymentListingReportThreshold) {
    reviewCodes.push("listing_report_threshold");
  }
  if (sellerReports >= sybnbConfig.reviewPaymentSellerReportThreshold) {
    reviewCodes.push("seller_report_threshold");
  }
  if (propertyEditedAfterRequest) {
    reviewCodes.push("listing_changed_after_request");
  } else if (listingRecentlyTouched) {
    reviewCodes.push("price_or_listing_changed_recently");
  }
  if (contactEditedAfterRequest) {
    reviewCodes.push("contact_changed_after_request");
  } else if (profileRecentlyTouched) {
    reviewCodes.push("phone_or_contact_changed_recently");
  }

  if (reviewCodes.length > 0) {
    return {
      level: "review",
      codes: reviewCodes,
      detail: `Payment requires review: ${reviewCodes.join(", ")}`,
    };
  }

  return { level: "ok" };
}
