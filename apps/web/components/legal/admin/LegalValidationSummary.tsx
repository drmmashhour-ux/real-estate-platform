"use client";

export type ValidationSummaryLite = {
  isValid?: boolean | null;
  missingFields?: string[];
  inconsistentFields?: string[];
  warnings?: string[];
};

export function LegalValidationSummary({
  validation,
}: {
  validation: ValidationSummaryLite | null | undefined;
}) {
  if (!validation) {
    return <p className="text-[11px] text-slate-600">No validation snapshot stored.</p>;
  }
  return (
    <ul className="list-inside list-disc space-y-1 text-[11px] text-slate-400">
      <li>Valid: {validation.isValid === true ? "yes" : validation.isValid === false ? "no" : "—"}</li>
      {validation.missingFields?.length ?
        <li>Missing: {validation.missingFields.join(", ")}</li>
      : null}
      {validation.inconsistentFields?.length ?
        <li>Inconsistent: {validation.inconsistentFields.join(", ")}</li>
      : null}
      {validation.warnings?.length ?
        <li>Warnings: {validation.warnings.join(" · ")}</li>
      : null}
    </ul>
  );
}
