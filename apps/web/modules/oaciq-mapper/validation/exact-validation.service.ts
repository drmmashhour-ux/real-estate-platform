import type { Deal } from "@prisma/client";
import { validateCp } from "../forms/cp/cp.validation";
import { validateDs } from "../forms/ds/ds.validation";
import { validateIv } from "../forms/iv/iv.validation";
import { validatePp } from "../forms/pp/pp.validation";
import { validateRh } from "../forms/rh/rh.validation";
import { validateRis } from "../forms/ris/ris.validation";
import { mapFormByKey } from "../map-form-router";
import type { ExactValidationIssue, MapFormResult } from "../mapper.types";
import type { CanonicalDealShape } from "../source-paths/canonical-deal-shape";
import { crossFormConsistencyIssues } from "./cross-form-consistency.service";
import { dateSequenceIssues } from "./date-sequence.service";
import { dependencyValidationIssues } from "./dependency-validation.service";
import { numericConsistencyIssues } from "./numeric-consistency.service";
import { issuesFromRequiredness } from "./requiredness.service";

function formSpecificIssues(formKey: string, map: MapFormResult, canonical: CanonicalDealShape): ExactValidationIssue[] {
  switch (formKey.toUpperCase()) {
    case "PP":
      return validatePp(map, canonical);
    case "CP":
      return validateCp(map, canonical);
    case "DS":
      return validateDs(map);
    case "IV":
      return validateIv(map);
    case "RIS":
      return validateRis(map);
    case "RH":
      return validateRh(map);
    default:
      return [];
  }
}

export type ExactValidationReport = {
  formKey: string;
  map: MapFormResult;
  issues: ExactValidationIssue[];
  sectionWarnings: ExactValidationIssue[];
  crossDocumentCriticals: ExactValidationIssue[];
  draftNotice: MapFormResult["draftNotice"];
};

export function validateExactForForm(formKey: string, canonical: CanonicalDealShape): ExactValidationReport {
  const map = mapFormByKey(formKey, canonical);
  const issues: ExactValidationIssue[] = [
    ...issuesFromRequiredness(map),
    ...formSpecificIssues(formKey, map, canonical),
  ];
  const sectionWarnings = issues.filter((i) => i.severity === "warning" || i.severity === "info");
  const crossDocumentCriticals = issues.filter((i) => i.severity === "critical");
  return {
    formKey: formKey.toUpperCase(),
    map,
    issues,
    sectionWarnings,
    crossDocumentCriticals,
    draftNotice: map.draftNotice,
  };
}

export function validateExactAllForms(
  deal: Deal,
  canonical: CanonicalDealShape,
  activeFormKeys: string[],
): {
  perForm: Record<string, ExactValidationReport>;
  globalIssues: ExactValidationIssue[];
} {
  const perForm: Record<string, ExactValidationReport> = {};
  for (const k of activeFormKeys) {
    const fk = k.toUpperCase();
    try {
      perForm[fk] = validateExactForForm(fk, canonical);
    } catch {
      /* unknown form */
    }
  }
  const globalIssues: ExactValidationIssue[] = [
    ...crossFormConsistencyIssues(deal, activeFormKeys),
    ...dateSequenceIssues(canonical),
    ...numericConsistencyIssues(canonical),
    ...dependencyValidationIssues(deal, canonical, activeFormKeys),
  ];
  return { perForm, globalIssues };
}
