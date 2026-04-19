/**
 * Structured console monitoring for pricing experiments — never throws.
 * Prefix: [lead:pricing-experiments]
 */

import type { LeadPricingDisplayPrecedence } from "@/modules/leads/lead-pricing-experiments.types";

const P = "[lead:pricing-experiments]";

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '"[unserializable]"';
  }
}

export function monitorExperimentBundleBuilt(payload: {
  leadId: string;
  modes: number;
  lowConfidenceModes: number;
}): void {
  try {
    console.info(`${P} bundle_built ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorOverrideCreated(payload: {
  leadId: string;
  overrideId: string;
  actorUserId: string;
  basePrice: number;
  systemSuggestedPrice: number;
  overridePrice: number;
}): void {
  try {
    console.info(`${P} override_created ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorOverrideCleared(payload: {
  leadId: string;
  overrideId: string;
  actorUserId: string;
}): void {
  try {
    console.info(`${P} override_cleared ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorOverrideSuperseded(payload: {
  leadId: string;
  previousOverrideId: string;
  newOverrideId: string;
  actorUserId: string;
}): void {
  try {
    console.info(`${P} override_superseded ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorLowConfidenceCase(payload: { leadId: string; mode: string; detail?: string }): void {
  try {
    console.warn(`${P} low_confidence ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorDisplayPrecedence(payload: {
  leadId: string;
  precedence: LeadPricingDisplayPrecedence;
  effectiveAdvisoryPrice: number;
}): void {
  try {
    console.info(`${P} display_precedence ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

/** Lightweight human-readable audit line for operator overrides (internal only). */
export function recordLeadPricingOverrideAuditLine(payload: {
  action: "created" | "cleared" | "superseded";
  leadId: string;
  actorUserId: string;
  reason?: string;
  previous?: { overridePrice?: number; status?: string };
  next?: { overridePrice?: number; status?: string };
}): void {
  try {
    console.info(`${P} override_audit ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}
