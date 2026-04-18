import { abandonedLeadReengagementDetector } from "./abandoned-lead-reengagement.detector";
import { highPerformingCampaignScaleDetector } from "./high-performing-campaign-scale.detector";
import { inactiveHostOrBrokerFollowupDetector } from "./inactive-host-or-broker-followup.detector";
import { lowAmenitiesCompletenessDetector } from "./low-amenities-completeness.detector";
import { lowConversionHighTrafficDetector } from "./low-conversion-high-traffic.detector";
import { lowPhotoQualityOrCountDetector } from "./low-photo-quality-or-count.detector";
import { overpricedLowConversionDetector } from "./overpriced-low-conversion.detector";
import { staleListingDetector } from "./stale-listing.detector";
import { underpricedHighDemandDetector } from "./underpriced-high-demand.detector";
import { weakListingContentDetector } from "./weak-listing-content.detector";
import type { AutonomyDetector } from "./detector.types";

export const defaultDetectorRegistry: readonly AutonomyDetector[] = [
  lowConversionHighTrafficDetector,
  staleListingDetector,
  underpricedHighDemandDetector,
  overpricedLowConversionDetector,
  weakListingContentDetector,
  lowPhotoQualityOrCountDetector,
  lowAmenitiesCompletenessDetector,
  abandonedLeadReengagementDetector,
  highPerformingCampaignScaleDetector,
  inactiveHostOrBrokerFollowupDetector,
];
