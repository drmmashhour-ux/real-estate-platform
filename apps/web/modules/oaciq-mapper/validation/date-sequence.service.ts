import type { ExactValidationIssue } from "../mapper.types";
import type { CanonicalDealShape } from "../source-paths/canonical-deal-shape";

function parseIso(s: string | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

export function dateSequenceIssues(canonical: CanonicalDealShape): ExactValidationIssue[] {
  const issues: ExactValidationIssue[] = [];
  const d = canonical.deal.dates;
  const deed = parseIso(d.deedOfSale);
  const occ = parseIso(typeof d.occupancy === "string" ? d.occupancy : undefined);
  if (deed && occ && occ < deed) {
    issues.push({
      severity: "warning",
      code: "dates.occupancy_before_deed",
      message: "Occupancy date precedes deed date in mapped data — verify against source documents.",
      brokerReviewRequired: true,
    });
  }
  return issues;
}
