import type { DarlinkMarketplaceDetector } from "./detector.types";
import { bookingDropoffDetector } from "./booking-dropoff.detector";
import { contentQualityDetector } from "./content-quality.detector";
import { engagementSpikeDetector } from "./engagement-spike.detector";
import { fraudRiskDetector } from "./fraud-risk.detector";
import { highInterestNoBookingDetector } from "./high-interest-no-booking.detector";
import { inactiveInventoryDetector } from "./inactive-inventory.detector";
import { lowConversionDetector } from "./low-conversion.detector";
import { payoutStressDetector } from "./payout-stress.detector";
import { pricingPressureDetector } from "./pricing-pressure.detector";
import { reviewBacklogDetector } from "./review-backlog.detector";
import { staleListingDetector } from "./stale-listing.detector";
import { trustRiskDetector } from "./trust-risk.detector";

/** Fixed evaluation order — deterministic. */
export const marketplaceDetectorRegistry: readonly DarlinkMarketplaceDetector[] = [
  lowConversionDetector,
  highInterestNoBookingDetector,
  staleListingDetector,
  pricingPressureDetector,
  trustRiskDetector,
  fraudRiskDetector,
  reviewBacklogDetector,
  bookingDropoffDetector,
  payoutStressDetector,
  contentQualityDetector,
  engagementSpikeDetector,
  inactiveInventoryDetector,
];
