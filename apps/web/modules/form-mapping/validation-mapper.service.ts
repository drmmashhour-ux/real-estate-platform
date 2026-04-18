import type { FieldMapResult } from "./form-mapping.types";

export function summarizeValidationForFieldMap(result: FieldMapResult): string[] {
  const lines: string[] = [];
  if (result.missingRequiredFields.length) lines.push(`Missing: ${result.missingRequiredFields.join(", ")}`);
  lines.push(...result.warnings);
  return lines;
}
