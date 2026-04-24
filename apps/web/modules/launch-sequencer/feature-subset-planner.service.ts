import type { LaunchDependency, LaunchFeatureSubset, LaunchReadinessScore } from "./launch-sequencer.types";
import { launchSequencerLog } from "./launch-sequencer.logger";

const FEATURES = [
  "listings",
  "crm",
  "dream_home",
  "messaging",
  "call_intelligence",
  "green_intelligence",
  "offer_strategy",
  "autonomy",
  "investor_views",
  "command_center_summaries",
] as const;

function blockingCompliance(deps: LaunchDependency[]): boolean {
  return deps.some((d) => d.blocking && d.type === "COMPLIANCE");
}

function blockingLocalization(deps: LaunchDependency[]): boolean {
  return deps.some((d) => d.blocking && d.type === "LOCALIZATION");
}

/**
 * Plan safe feature subset per market. Conservative by default for new / incomplete markets.
 * Never throws.
 */
export function planMarketFeatureSubset(
  marketKey: string,
  readiness: LaunchReadinessScore,
  dependencies: LaunchDependency[],
): LaunchFeatureSubset {
  try {
    const key = String(marketKey ?? "").trim() || "UNKNOWN";
    const enabled = new Set<string>();
    const restricted = new Set<string>();
    const blocked = new Set<string>();
    const rationale: string[] = [];

    const r = readiness.score;
    const compBlock = blockingCompliance(dependencies);
    const locBlock = blockingLocalization(dependencies);
    const anyBlock = dependencies.some((d) => d.blocking);

    const addBlock = (f: (typeof FEATURES)[number]) => blocked.add(f);
    const addEn = (f: (typeof FEATURES)[number]) => enabled.add(f);
    const addRest = (f: (typeof FEATURES)[number]) => restricted.add(f);

    if (r < 35 || compBlock || locBlock) {
      addEn("command_center_summaries");
      addEn("listings");
      addRest("investor_views");
      FEATURES.forEach((f) => {
        if (!enabled.has(f) && !restricted.has(f)) addBlock(f);
      });
      rationale.push(
        "Scenario: not_ready or compliance/localization gate blocking — listings + summaries only; investor views restricted.",
        "Messaging, calls, autonomy, and CRM are blocked pending explicit clearance (planner does not enforce).",
      );
    } else if (r < 55) {
      ["command_center_summaries", "listings", "investor_views", "crm"].forEach(addEn);
      ["dream_home", "messaging", "offer_strategy", "green_intelligence"].forEach(addRest);
      ["call_intelligence", "autonomy"].forEach(addBlock);
      rationale.push("Scenario: pilot_ready — broker-assisted CRM with conservative customer channels.");
    } else if (r < 75) {
      [
        "command_center_summaries",
        "listings",
        "investor_views",
        "crm",
        "dream_home",
        "messaging",
        "offer_strategy",
        "green_intelligence",
      ].forEach(addEn);
      ["call_intelligence", "autonomy"].forEach(addRest);
      rationale.push("Scenario: limited_launch — broader core; autonomy and call intelligence not fully opened.");
    } else {
      FEATURES.forEach(addEn);
      rationale.push("Scenario: launch_ready heuristic — all features listed as enabled in plan output only.");
    }

    if (r >= 75 && anyBlock) {
      ["autonomy", "call_intelligence", "messaging"].forEach((f) => {
        enabled.delete(f);
        restricted.add(f);
      });
      rationale.push("Blocking dependencies remain — downgraded messaging/call/autonomy to restricted.");
    }

    for (const f of FEATURES) {
      if (!enabled.has(f) && !restricted.has(f) && !blocked.has(f)) {
        restricted.add(f);
      }
    }

    launchSequencerLog.info("feature_subset_planned", { marketKey: key, enabled: enabled.size, blocked: blocked.size });
    return {
      marketKey: key,
      enabledFeatures: [...enabled],
      restrictedFeatures: [...restricted],
      blockedFeatures: [...blocked],
      rationale,
    };
  } catch {
    launchSequencerLog.warn("feature_subset_planned_failed", { marketKey });
    return {
      marketKey: String(marketKey),
      enabledFeatures: ["command_center_summaries"],
      restrictedFeatures: ["listings"],
      blockedFeatures: FEATURES.filter((f) => f !== "command_center_summaries" && f !== "listings"),
      rationale: ["Fallback: safest minimal subset after planner error."],
    };
  }
}

// silence unused partition helper if TS complains - remove partition function