import { generateCityPlaybook } from "@/modules/city-launch/city-launch-playbook.service";

import { getCountryConfig, recordCountryLaunch, setCountryExpansionStatus } from "./global-country.service";
import { getRegulationViewFromConfig } from "./global-regulation.service";
import { defaultLocaleForCountry, marketingAdaptationPlan } from "./global-localization.service";
import { formatCurrencyDisplay } from "./global-currency.service";

import type { LaunchCountryResult } from "./global.types";

/**
 * Country launch sequence — idempotent, explainable, no legal claims.
 * Wires to City Launch (playbook gen), marks expansion status, returns checklist.
 */
export function launchCountry(countryCode: string, pilotTerritoryId = "mtl-core"): LaunchCountryResult {
  const c = getCountryConfig(countryCode);
  if (!c) {
    return {
      countryCode,
      ok: false,
      steps: [{ id: "cfg", label: "Load config", done: false, detail: "Unknown country" }],
      nextActions: ["Add or enable country in platform config and expansion registry"],
      audit: ["launch_failed: missing CountryConfig"],
      disclaimer: "No launch performed — configuration missing.",
    };
  }

  const steps: LaunchCountryResult["steps"] = [];
  const audit: string[] = [];
  const upper = c.countryCode;

  const reg = getRegulationViewFromConfig(c);
  steps.push({
    id: "reg",
    label: "Regulation view generated",
    done: true,
    detail: `${reg.allowedActions.length} allowed / ${reg.restrictedActions.length} restricted labels (awareness)`,
  });
  audit.push(`regulation_view:${upper}`);

  const loc = marketingAdaptationPlan(upper, defaultLocaleForCountry(upper));
  steps.push({
    id: "loc",
    label: "Localization & marketing plan stub",
    done: true,
    detail: loc.notes.slice(0, 200),
  });
  audit.push(`locale_plan:${loc.locale}`);

  const playbook = generateCityPlaybook(pilotTerritoryId);
  steps.push({
    id: "playbook",
    label: "City playbook generated (pilot)",
    done: !!playbook,
    detail: playbook ? `Playbook for ${pilotTerritoryId} with ${playbook.steps.length} steps` : "No playbook — check territory id",
  });
  audit.push(`city_playbook:${pilotTerritoryId}:${playbook ? "ok" : "fail"}`);

  steps.push({
    id: "hubs",
    label: "Hub activation (config)",
    done: true,
    detail: `Active hubs: ${c.activeHubs.join(", ")} — product toggles in deployment`,
  });
  audit.push(`hubs:${c.activeHubs.join(".")}`);

  steps.push({
    id: "fx",
    label: "Currency display sanity",
    done: true,
    detail: formatCurrencyDisplay(100_00, c.currency, "en").formatted + " sample",
  });

  setCountryExpansionStatus(upper, "active");

  const doneLabels = steps.filter((s) => s.done).map((s) => s.label);
  recordCountryLaunch(upper, doneLabels);

  return {
    countryCode: upper,
    ok: true,
    steps,
    nextActions: [
      "Review regulation tokens with counsel",
      "Map pilot city playbook owners in CRM",
      "Enable feature flags in deployment matching enabledFeatures",
      "Point marketing engine calendar to " + c.supportedCities[0],
    ],
    audit,
    disclaimer: getRegulationViewFromConfig(c).disclaimer,
  };
}
