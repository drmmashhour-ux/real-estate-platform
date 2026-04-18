import type { Opportunity } from "../types/domain.types";
import type { ObservationSnapshot } from "../types/domain.types";
import { lowConversionHighTrafficDetector } from "./low-conversion-high-traffic.detector";
import { staleListingDetector } from "./stale-listing.detector";
import { weakListingContentDetector } from "./weak-listing-content.detector";
import type { AutonomyDetector } from "./detector.types";

/**
 * Preview-only registry — three listing detectors; suggestions are not executed here.
 */
export const previewDetectorRegistry: readonly AutonomyDetector[] = [
  lowConversionHighTrafficDetector,
  staleListingDetector,
  weakListingContentDetector,
];

export function runPreviewDetectors(observation: ObservationSnapshot): Opportunity[] {
  const acc: Opportunity[] = [];
  for (const detector of previewDetectorRegistry) {
    try {
      acc.push(...detector.run(observation));
    } catch {
      /* preview path — skip detector failure */
    }
  }
  return acc;
}
