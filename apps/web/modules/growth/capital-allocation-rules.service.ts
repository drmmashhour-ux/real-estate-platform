/**
 * Deterministic bucket classification — first matching rule wins (checked in order).
 */

import type { CapitalAllocationBucketId } from "@/modules/growth/capital-allocation.types";
import type { NormalizedCitySignals } from "@/modules/growth/capital-allocation-signals.service";

export function classifyCityBucket(norm: NormalizedCitySignals): {
  bucket: CapitalAllocationBucketId;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (
    norm.dataTier === "low" &&
    (norm.performanceScore == null || norm.performanceScore < 42)
  ) {
    reasons.push("Thin Fast Deal attribution or low comparative score — hold pending better logs.");
    return { bucket: "hold", reasons };
  }

  if (
    norm.growthPotential != null &&
    norm.growthPotential >= 0.52 &&
    norm.expansionReadiness === "high" &&
    norm.expansionConfidence !== "low"
  ) {
    reasons.push("Expansion engine shows readiness with measurable demand/supply context.");
    return { bucket: "city_expansion", reasons };
  }

  if (
    (norm.performanceScore ?? 0) >= 62 &&
    norm.executionStrength != null &&
    norm.executionStrength >= 0.42 &&
    norm.cityConfidence !== "low"
  ) {
    reasons.push("Strong logged execution ratios + acceptable city confidence.");
    return { bucket: "city_execution", reasons };
  }

  if (norm.weakConversionHint) {
    reasons.push("Lead volume exists but playbook completion trails peers — conversion focus.");
    return { bucket: "conversion_optimization", reasons };
  }

  if (norm.thinSupplyHint) {
    reasons.push("Demand proxy exceeds thin FSBO supply — broker/listing build-out.");
    return { bucket: "broker_acquisition", reasons };
  }

  reasons.push("No decisive bucket — default hold until signals strengthen.");
  return { bucket: "hold", reasons };
}

export function classifySystemBrokerBucket(params: {
  insufficientBrokerRows: number;
  totalBrokerRows: number;
  scaleBrokersDelta: number | undefined;
}): CapitalAllocationBucketId | null {
  if (params.totalBrokerRows === 0) return null;
  const ratio = params.insufficientBrokerRows / params.totalBrokerRows;
  if (ratio >= 0.45 || (params.scaleBrokersDelta != null && params.scaleBrokersDelta < 0)) {
    return "broker_acquisition";
  }
  return null;
}
