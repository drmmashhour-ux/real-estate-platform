import type {
  LeadPricingDisplayPrecedence,
  LeadPricingOverride,
} from "@/modules/leads/lead-pricing-experiments.types";

export type ResolveInternalLeadPricingDisplayInput = {
  basePrice: number;
  /** Monetization control primary advisory suggestion. */
  monetizationSuggestedPrice: number;
  activeOverride: LeadPricingOverride | null | undefined;
};

export type InternalLeadPricingDisplayResult = {
  effectiveAdvisoryPrice: number;
  precedence: LeadPricingDisplayPrecedence;
  /** Operator-facing sentence — emphasizes internal advisory scope. */
  explanation: string;
};

/**
 * Internal CRM/admin only: which advisory dollar figure to emphasize in tooling.
 * Precedence: active operator override → monetization primary → revenue base.
 */
export function resolveInternalLeadPricingDisplay(
  input: ResolveInternalLeadPricingDisplayInput,
): InternalLeadPricingDisplayResult {
  const base = sanitizePrice(input.basePrice);
  const mono = sanitizePrice(input.monetizationSuggestedPrice);

  const active =
    input.activeOverride?.status === "active" ? input.activeOverride : null;

  if (active) {
    const p = sanitizePrice(active.overridePrice);
    return {
      effectiveAdvisoryPrice: p,
      precedence: "operator_override",
      explanation:
        `Internal advisory display uses the active operator override ($${p.toLocaleString()} CAD). ` +
        `This does not change live unlock pricing, Stripe, or checkout — revert by clearing the override.`,
    };
  }

  if (mono > base || mono < base) {
    return {
      effectiveAdvisoryPrice: mono,
      precedence: "monetization_primary",
      explanation:
        `Internal advisory display uses the monetization control primary suggestion ($${mono.toLocaleString()} CAD) over base ($${base.toLocaleString()}). ` +
        `Advisory only — not auto-applied publicly.`,
    };
  }

  return {
    effectiveAdvisoryPrice: base,
    precedence: "base_fallback",
    explanation:
      `Internal advisory display falls back to revenue-engine base ($${base.toLocaleString()} CAD) — no layered uplift applied.`,
  };
}

function sanitizePrice(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}
