/**
 * Deterministic journey validation — no throws; returns structured errors only.
 */

import { HUB_JOURNEY_DEFINITIONS, resolveStepRoute } from "./hub-journey-definitions";
import { buildHubJourneyPlan } from "./hub-journey-state.service";
import type { HubJourneyPlan } from "./hub-journey.types";
import { HUB_KEYS, type HubKey } from "./hub-journey.types";

export type JourneyValidationResult = {
  valid: boolean;
  errors: string[];
};

const EMPTY_CTX = (locale: string, country: string) => ({
  locale,
  country,
  userId: null as string | null,
});

/** Ensures resolved routes match hub class: admin uses `/admin/...`, others use `/{locale}/{country}/...`. */
export function validateRouteResolution(
  hub: HubKey,
  stepId: string,
  route: string | undefined,
  locale = "en",
  country = "ca",
): JourneyValidationResult {
  const errors: string[] = [];
  if (route === undefined || route === "") {
    return { valid: true, errors };
  }

  if (hub === "admin") {
    if (!route.startsWith("/admin")) {
      errors.push(`Admin hub step ${stepId}: route must start with /admin, got ${route}`);
    }
    return { valid: errors.length === 0, errors };
  }

  const expectedPrefix = `/${locale}/${country}/`;
  if (!route.startsWith(expectedPrefix) && !route.startsWith("http")) {
    errors.push(
      `Hub ${hub} step ${stepId}: route must start with ${expectedPrefix} or http, got ${route}`,
    );
  }

  return { valid: errors.length === 0, errors };
}

/** Validates an assembled plan object (refs, uniqueness, optional route checks). */
export function validateHubJourneyPlan(plan: HubJourneyPlan, locale = "en", country = "ca"): JourneyValidationResult {
  const errors: string[] = [];

  if (!plan.steps?.length) {
    errors.push(`Hub ${plan.hub}: plan has no steps`);
    return { valid: false, errors };
  }

  const ids = new Set<string>();
  for (const step of plan.steps) {
    if (ids.has(step.id)) {
      errors.push(`Hub ${plan.hub}: duplicate step id "${step.id}"`);
    }
    ids.add(step.id);
    const rr = validateRouteResolution(plan.hub, step.id, step.route, locale, country);
    errors.push(...rr.errors);
  }

  if (plan.currentStepId && !ids.has(plan.currentStepId)) {
    errors.push(`Hub ${plan.hub}: currentStepId "${plan.currentStepId}" not found in steps`);
  }
  if (plan.nextStepId && !ids.has(plan.nextStepId)) {
    errors.push(`Hub ${plan.hub}: nextStepId "${plan.nextStepId}" not found in steps`);
  }

  return { valid: errors.length === 0, errors };
}

/** Validates definitions for every hub and that empty-context plans resolve. */
export function validateHubJourneyDefinitions(locale = "en", country = "ca"): JourneyValidationResult {
  const errors: string[] = [];

  for (const hub of HUB_KEYS) {
    const defs = HUB_JOURNEY_DEFINITIONS[hub];
    if (!defs?.length) {
      errors.push(`Missing definitions for hub ${hub}`);
      continue;
    }

    const rawIds = defs.map((d) => d.id);
    const seen = new Set<string>();
    for (const id of rawIds) {
      if (seen.has(id)) errors.push(`Hub ${hub}: duplicate definition step id "${id}"`);
      seen.add(id);
    }

    let plan: HubJourneyPlan;
    try {
      plan = buildHubJourneyPlan(hub, EMPTY_CTX(locale, country));
    } catch (e) {
      errors.push(`buildHubJourneyPlan threw for ${hub}: ${String(e)}`);
      continue;
    }

    const planCheck = validateHubJourneyPlan(plan, locale, country);
    errors.push(...planCheck.errors);

    for (const def of defs) {
      try {
        const resolved = resolveStepRoute(def.route, locale, country);
        const rr = validateRouteResolution(hub, def.id, resolved, locale, country);
        errors.push(...rr.errors);
      } catch (e) {
        errors.push(`resolveStepRoute threw for ${hub} ${def.id}: ${String(e)}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Legacy aggregate — warnings dropped; maps to `{ valid, errors }`. */
export function validateHubJourneyDefinitionsInvariant(): {
  ok: boolean;
  errors: string[];
  warnings: string[];
} {
  const r = validateHubJourneyDefinitions();
  return { ok: r.valid, errors: r.errors, warnings: [] };
}
