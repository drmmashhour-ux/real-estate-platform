import type { CountryConfig, RegulationView } from "./global.types";

const DISCLAIMER =
  "Configuration and awareness only — not legal advice. Operators must obtain qualified counsel for each market.";

/**
 * Returns allowed / restricted action labels for admin UX and audit.
 * Replace token lists with counsel-approved playbooks per deployment.
 */
export function getRegulationViewFromConfig(c: CountryConfig): RegulationView {
  const code = c.countryCode.toUpperCase();

  const allowed: string[] = [
    "List properties with jurisdiction-appropriate moderation",
    "Route leads with auditable attribution by market",
    "Enable BNHub where product + policy sign-off completed",
    "Record broker credentials when required by local schema (verify externally)",
  ];

  const restricted: string[] = [
    "Automated mass marketing without consent framework review",
    "Cross-border payment flows without treasury + sanctions check",
    "Storing health or sensitive PII without DPA and purpose binding",
    "Guaranteeing investment returns in content or CRM",
  ];

  const warnings: string[] = [
    `Flags on file: ${c.regulatoryFlags?.length ? c.regulatoryFlags.join(", ") : "none — add in config"}`,
    "Escalate legal review when adding new hub or payment rail in this country.",
  ];

  if (code === "CA") {
    restricted.push("Provincial broker advertising without board review where applicable");
    warnings.push("REC: document RECO/OACIQ-style obligations per province before broker scale.");
  }
  if (code === "SY") {
    restricted.push("International card clearing where manual rail is mandated");
    warnings.push("Sanctions and crisis comms must be reviewed outside this dashboard.");
  }
  if (code === "FR" || code === "AE") {
    warnings.push("EU/GCC marketing and data rules differ significantly — do not copy CA defaults.");
  }

  return {
    countryCode: code,
    allowedActions: allowed,
    restrictedActions: restricted,
    adminWarnings: warnings,
    disclaimer: DISCLAIMER,
    lastReviewedByPolicyNote: "Set last counsel review date in external governance system — not stored in v1 engine.",
  };
}
