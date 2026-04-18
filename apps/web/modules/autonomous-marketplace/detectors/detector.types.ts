import type { Opportunity } from "../types/domain.types";
import type { ObservationSnapshot } from "../types/domain.types";

export type AutonomyDetector = {
  id: string;
  description: string;
  run: (observation: ObservationSnapshot) => Opportunity[];
};

export type DetectorRegistry = readonly AutonomyDetector[];
