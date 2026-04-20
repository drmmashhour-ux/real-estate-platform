import type { Opportunity } from "../types/domain.types";
import type { ObservationSnapshot } from "../types/domain.types";
import { defaultDetectorRegistry } from "./detector-registry";
import { lowConversionHighTrafficDetector } from "./low-conversion-high-traffic.detector";
import { staleListingDetector } from "./stale-listing.detector";
import { weakListingContentDetector } from "./weak-listing-content.detector";
import type { AutonomyDetector } from "./detector.types";

/**
 * Preview-only registry — fixed members, sorted by id for deterministic iteration (no dynamic insertion).
 */
const PREVIEW_DETECTORS_ORDERED: readonly AutonomyDetector[] = [
  lowConversionHighTrafficDetector,
  staleListingDetector,
  weakListingContentDetector,
];

export const previewDetectorRegistry: readonly AutonomyDetector[] = [...PREVIEW_DETECTORS_ORDERED].sort((a, b) =>
  a.id.localeCompare(b.id),
);

export function runPreviewDetectors(observation: ObservationSnapshot): Opportunity[] {
  return runListingPreviewDetectors(observation, { fullRegistry: false });
}

/** Read-only detector pass — subset or full marketplace registry (no execution). */
export function runListingPreviewDetectors(
  observation: ObservationSnapshot,
  opts?: { fullRegistry?: boolean },
): Opportunity[] {
  const registry = opts?.fullRegistry ? defaultDetectorRegistry : previewDetectorRegistry;
  const acc: Opportunity[] = [];
  for (const detector of registry) {
    try {
      acc.push(...detector.run(observation));
    } catch {
      /* preview path — skip detector failure */
    }
  }
  return acc;
}
