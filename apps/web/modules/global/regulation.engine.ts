/**
 * Regulation surface for market expansion — rules and constraints are operator awareness,
 * not legal advice. Counsel must sign off per jurisdiction.
 */

import { getCountryConfig } from "@/modules/global-expansion/global-country.service";
import { getRegulationViewFromConfig } from "@/modules/global-expansion/global-regulation.service";

export type RegulationRule = {
  id: string;
  kind: "allowed" | "restricted" | "warning";
  label: string;
  source: "country_config" | "regulation_view";
};

export type RegulationConstraint = {
  id: string;
  /** Human-readable constraint — templates only */
  summary: string;
  /** e.g. data_handling, payments, marketing */
  domain: "data" | "payments" | "marketing" | "brokerage" | "general";
  /** When this constraint is considered active */
  appliesToCountryCodes: string[] | "ALL";
};

const BASE_CONSTRAINTS: RegulationConstraint[] = [
  {
    id: "cns-consent",
    summary: "Marketing and CRM outreach require a documented consent and purpose framework per market.",
    domain: "marketing",
    appliesToCountryCodes: "ALL",
  },
  {
    id: "cns-treasury",
    summary: "Cross-border or alternate payment rails need treasury and sanctions review before enable.",
    domain: "payments",
    appliesToCountryCodes: "ALL",
  },
  {
    id: "cns-pii",
    summary: "PII storage, retention, and sub-processors must match data-handling mode for the market.",
    domain: "data",
    appliesToCountryCodes: "ALL",
  },
];

/**
 * Flattens configured regulatory flags and the regulation view into a stable list for dashboards and audits.
 */
export function listRegulationRulesForCountry(countryCode: string): RegulationRule[] {
  const c = getCountryConfig(countryCode);
  if (!c) return [];

  const view = getRegulationViewFromConfig(c);
  const out: RegulationRule[] = [];

  for (const flag of c.regulatoryFlags ?? []) {
    out.push({
      id: `flag-${c.countryCode}-${flag}`,
      kind: "warning",
      label: flag,
      source: "country_config",
    });
  }
  for (const label of view.allowedActions) {
    out.push({
      id: `allow-${hash(label)}`,
      kind: "allowed",
      label,
      source: "regulation_view",
    });
  }
  for (const label of view.restrictedActions) {
    out.push({
      id: `res-${hash(label)}`,
      kind: "restricted",
      label,
      source: "regulation_view",
    });
  }
  for (const label of view.adminWarnings) {
    out.push({
      id: `warn-${hash(label)}`,
      kind: "warning",
      label,
      source: "regulation_view",
    });
  }
  return out;
}

/**
 * Returns base constraints plus any country-specific items derived from config (e.g. data mode).
 */
export function listRegulationConstraintsForCountry(countryCode: string): RegulationConstraint[] {
  const c = getCountryConfig(countryCode);
  const base = [...BASE_CONSTRAINTS];
  if (!c) return base;

  if (c.dataHandlingMode === "STRICT_PII" || c.dataHandlingMode === "ENCRYPTED_AT_REST_PREFERENCE") {
    base.push({
      id: `cns-data-${c.countryCode}`,
      summary: `Data handling mode ${c.dataHandlingMode}: treat as elevated review for new features.`,
      domain: "data",
      appliesToCountryCodes: [c.countryCode],
    });
  }
  return base;
}

/**
 * Full regulation snapshot for a market — use in admin / planning only.
 */
export function evaluateRegulationSurface(countryCode: string) {
  const c = getCountryConfig(countryCode);
  if (!c) {
    return {
      ok: false as const,
      countryCode: countryCode.toUpperCase(),
      message: "Unknown country in expansion registry",
    };
  }
  const view = getRegulationViewFromConfig(c);
  return {
    ok: true as const,
    countryCode: c.countryCode,
    view,
    rules: listRegulationRulesForCountry(countryCode),
    constraints: listRegulationConstraintsForCountry(countryCode),
  };
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(Math.abs(h));
}
