/**
 * Directional rule templates tied to baseline signals — bounded magnitude only.
 */

import type {
  SimulationActionCategory,
  SimulationBaseline,
  SimulationActionInput,
  SimulationEffectEstimate,
  SimulationConfidence,
  PredictedDirection,
  PredictedMagnitude,
  SimulationIntensity,
} from "@/modules/growth/action-simulation.types";

function magFromIntensity(i: SimulationIntensity): PredictedMagnitude {
  if (i === "high") return "medium";
  if (i === "medium") return "medium";
  return "low";
}

function baseConf(b: SimulationBaseline): SimulationConfidence {
  return b.confidence;
}

function directionalConf(
  baselineConf: SimulationConfidence,
  intrinsic: SimulationConfidence,
): SimulationConfidence {
  const o = { low: 0, medium: 1, high: 2 };
  return o[baselineConf] <= o[intrinsic] ? baselineConf : intrinsic;
}

function estimate(
  metric: string,
  baselineValue: number | string | undefined,
  predictedDirection: PredictedDirection,
  predictedMagnitude: PredictedMagnitude,
  baseline: SimulationBaseline,
  intrinsicConfidence: SimulationConfidence,
  explanation: string,
): SimulationEffectEstimate {
  return {
    metric,
    baselineValue,
    predictedDirection,
    predictedMagnitude,
    confidence: directionalConf(baseConf(baseline), intrinsicConfidence),
    explanation,
  };
}

/** Deterministic scenario rules — narratives stay correlational / bounded. */
export function applySimulationRules(input: SimulationActionInput, baseline: SimulationBaseline): SimulationEffectEstimate[] {
  const cat: SimulationActionCategory = input.category;
  const intensityMag = magFromIntensity(input.intensity);
  const lowVol = baseline.confidence === "low";

  switch (cat) {
    case "broker_acquisition": {
      const cap =
        baseline.brokers > 20
          ? estimate(
              "Broker roster depth",
              baseline.brokers,
              "up",
              intensityMag,
              baseline,
              lowVol ? "low" : "medium",
              `More broker onboarding typically increases handling capacity vs current roster (${baseline.brokers}); short-term monetization uplift is uncertain until listings attach.`,
            )
          : estimate(
              "Broker roster depth",
              baseline.brokers,
              "up",
              "medium",
              baseline,
              lowVol ? "low" : "medium",
              `Thin roster (${baseline.brokers}) implies capacity lift if onboarding succeeds — close-rate movement still depends on pipeline quality.`,
            );
      const supplyPressure = estimate(
        "Listing-to-broker tension",
        baseline.listings,
        baseline.listings > baseline.brokers * 3 ? "down" : "flat",
        "low",
        baseline,
        "medium",
        "When listings outpace brokers, relieving supply-side pressure may improve responsiveness — directional only.",
      );
      const closeUncertain = estimate(
        "Near-term close rate",
        baseline.closeRate ?? "unknown",
        baseline.closeRate != null ? "uncertain" : "uncertain",
        "unknown",
        baseline,
        "low",
        `Close-rate movement in the next ${input.windowDays}d is noisy — broker acquisition lifts capacity, not guarantees.`,
      );
      return [cap, supplyPressure, closeUncertain];
    }
    case "demand_generation": {
      return [
        estimate(
          "New lead volume",
          baseline.leads,
          "up",
          intensityMag,
          baseline,
          lowVol ? "medium" : "medium",
          `Inbound lift is plausible if acquisition spend / channels activate — conversion quality may lag volume.`,
        ),
        estimate(
          "Conversion proxy",
          baseline.conversionRate ?? "n/a",
          baseline.conversionRate != null ? "flat" : "uncertain",
          baseline.conversionRate != null ? "low" : "unknown",
          baseline,
          baseline.conversionRate != null ? "medium" : "low",
          "Demand bursts often leave conversion unchanged until nurture tightens — guard against volume-only KPIs.",
        ),
      ];
    }
    case "supply_growth": {
      return [
        estimate(
          "Active listings",
          baseline.listings,
          "up",
          intensityMag,
          baseline,
          "medium",
          "Listing growth expands supply-side inventory — relevance still depends on city/market appetite.",
        ),
        estimate(
          "Lead satisfaction / match quality",
          baseline.leads,
          "flat",
          "low",
          baseline,
          "medium",
          "Pure supply pushes can leave buyer-side match quality unchanged short term.",
        ),
      ];
    }
    case "conversion_fix": {
      return [
        estimate(
          "Stage conversion",
          baseline.conversionRate ?? "unknown",
          "up",
          intensityMag,
          baseline,
          lowVol ? "low" : "medium",
          "Targeting funnel leaks usually raises qualified progression before raw lead volume moves.",
        ),
        estimate(
          "Illustrative revenue band",
          baseline.revenueEstimate ?? "unset",
          baseline.revenueEstimate != null ? "up" : "uncertain",
          baseline.revenueEstimate != null ? "medium" : "unknown",
          baseline,
          baseline.revenueEstimate != null ? "medium" : "low",
          "Better conversion eventually lifts illustrative revenue projections — not booked revenue.",
        ),
        estimate(
          "Lead volume",
          baseline.leads,
          "flat",
          "low",
          baseline,
          "high",
          "Pure conversion fixes rarely mint net-new leads without traffic changes.",
        ),
      ];
    }
    case "routing_shift": {
      const eliteSignals = baseline.brokers >= 10;
      return [
        estimate(
          "Deal quality vs speed",
          baseline.closeRate ?? "unknown",
          eliteSignals ? "up" : "uncertain",
          eliteSignals ? intensityMag : "unknown",
          baseline,
          eliteSignals ? "medium" : "low",
          eliteSignals
            ? "Routing toward proven brokers may lift close probability when telemetry already shows tier strength."
            : "Thin broker telemetry — routing bets are higher variance and may overload few producers.",
        ),
        estimate(
          "Fairness / overload risk",
          baseline.brokers,
          "uncertain",
          "medium",
          baseline,
          "medium",
          "Elite-skew routing can congest capacity — monitor workload manually.",
        ),
      ];
    }
    case "timing_focus": {
      return [
        estimate(
          "Response latency vs drop-off",
          baseline.leads,
          "up",
          intensityMag,
          baseline,
          lowVol ? "low" : "medium",
          "Faster follow-up correlates with fewer stale leads in CRM telemetry — effect size depends on queue depth.",
        ),
        estimate(
          "Pipeline throughput",
          baseline.leads,
          "up",
          "low",
          baseline,
          "medium",
          "Short-window execution focus mainly rearranges timing — does not guarantee net-new demand.",
        ),
      ];
    }
    case "city_domination": {
      const cityHint = input.targetCity?.trim();
      const geoGap = !cityHint;
      return [
        estimate(
          "City-level capture",
          cityHint ?? "unspecified",
          geoGap ? "uncertain" : "up",
          geoGap ? "unknown" : intensityMag,
          baseline,
          geoGap ? "low" : lowVol ? "medium" : "medium",
          geoGap
            ? "Specify a target city — geo concentration cannot be simulated without it."
            : `Playbook intensity in ${cityHint} may lift local capture if weekly + expansion signals align — still correlational.`,
        ),
        estimate(
          "Cross-city spillover",
          baseline.leads,
          "flat",
          "low",
          baseline,
          "medium",
          "City domination rarely hurts other metros immediately; evidence for spillover uplift is weak.",
        ),
      ];
    }
    case "retention_focus": {
      return [
        estimate(
          "Broker churn / dependency risk",
          baseline.brokers,
          "down",
          "low",
          baseline,
          "medium",
          "Relationship touches aim to reduce reliance volatility — measurable revenue lift is lagging.",
        ),
        estimate(
          "Pipeline stability",
          baseline.leads,
          "flat",
          "low",
          baseline,
          "medium",
          "Retention work stabilizes supply side; lead volume effects are secondary.",
        ),
      ];
    }
    default:
      return [
        estimate(
          "Scenario effects",
          "—",
          "uncertain",
          "unknown",
          baseline,
          "low",
          "No mapped category — treat as exploratory.",
        ),
      ];
  }
}
