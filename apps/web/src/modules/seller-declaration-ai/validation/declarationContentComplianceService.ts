export type DeclarationContentIssue = {
  sectionKey: string;
  fieldKey: string;
  severity: "warning" | "block";
  message: string;
  suggestion: string;
};

const FIELD_SECTION_MAP: Record<string, string> = {
  property_address: "property_identity",
  property_type: "property_identity",
  year_built: "property_identity",
  occupancy_notes: "ownership_occupancy",
  known_defects_details: "known_defects",
  water_damage_details: "water_damage",
  structural_issues_details: "structural_issues",
  renovations_details: "renovations_repairs",
  legal_dispute_details: "legal_disputes",
  environmental_details: "environmental_concerns",
  inclusions: "inclusions_exclusions",
  exclusions: "inclusions_exclusions",
  lease_details: "tenant_lease_status",
  contingency_fund_details: "coownership_financials",
  special_assessment_details: "coownership_financials",
  condo_rules_notes: "coownership_financials",
  additional_notes: "additional_notes",
};

const PROMOTIONAL_LANGUAGE = [
  "best",
  "perfect",
  "amazing",
  "luxury",
  "stunning",
  "beautiful",
  "dream home",
  "flawless",
  "mint condition",
];

const UNSUPPORTED_GUARANTEES = [
  "no issues",
  "no issue",
  "problem free",
  "zero problems",
  "guaranteed",
  "guarantee",
  "fully compliant",
  "100% compliant",
  "nothing to disclose",
];

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hasYearLikeDetail(value: string) {
  return /\b(19|20)\d{2}\b/.test(value);
}

function hasAreaOrStatusDetail(value: string) {
  return /\b(basement|roof|foundation|kitchen|bathroom|bedroom|garage|wall|ceiling|floor|resolved|repaired|ongoing|current|status)\b/.test(
    value
  );
}

export function evaluateDeclarationContentCompliance(
  payload: Record<string, unknown>
): DeclarationContentIssue[] {
  const issues: DeclarationContentIssue[] = [];

  for (const [fieldKey, rawValue] of Object.entries(payload)) {
    const value = normalize(rawValue);
    if (!value) continue;

    const sectionKey = FIELD_SECTION_MAP[fieldKey];
    if (!sectionKey) continue;

    if (PROMOTIONAL_LANGUAGE.some((token) => value.includes(token))) {
      issues.push({
        sectionKey,
        fieldKey,
        severity: "warning",
        message: "Avoid promotional or sales language in a seller declaration answer.",
        suggestion: "Rewrite this field using neutral, factual wording only.",
      });
    }

    if (UNSUPPORTED_GUARANTEES.some((token) => value.includes(token))) {
      issues.push({
        sectionKey,
        fieldKey,
        severity: "block",
        message: "Avoid blanket guarantees or unsupported legal/compliance assurances.",
        suggestion: "State only the facts actually known to the seller, with dates, scope, and current status.",
      });
    }

    if (fieldKey.endsWith("_details") && value.length > 0 && value.length < 18) {
      issues.push({
        sectionKey,
        fieldKey,
        severity: "warning",
        message: "This description looks too short to support an OACIQ-style factual disclosure.",
        suggestion: "Add when it happened, which area was affected, and the current status or repair outcome.",
      });
    }

    if (
      ["water_damage_details", "structural_issues_details", "legal_dispute_details", "environmental_details"].includes(fieldKey) &&
      value &&
      (!hasYearLikeDetail(value) || !hasAreaOrStatusDetail(value))
    ) {
      issues.push({
        sectionKey,
        fieldKey,
        severity: "warning",
        message: "This disclosure may be missing date, affected area, or current status details.",
        suggestion: "Add factual timing, location, and present condition or resolution details where known.",
      });
    }

    if (fieldKey === "renovations_details" && value && !hasYearLikeDetail(value)) {
      issues.push({
        sectionKey,
        fieldKey,
        severity: "warning",
        message: "Renovation or repair details should include a date or period when known.",
        suggestion: "Add the renovation year or approximate period, and mention who completed the work if known.",
      });
    }

    if (fieldKey === "contingency_fund_details" && value && !/\b(fund|reserve|balance|repair|assessment)\b/.test(value)) {
      issues.push({
        sectionKey,
        fieldKey,
        severity: "warning",
        message: "Condo contingency-fund details should mention the fund or major repair financial context.",
        suggestion: "Add known reserve-fund, repair-planning, or assessment information in neutral factual language.",
      });
    }
  }

  return issues;
}
