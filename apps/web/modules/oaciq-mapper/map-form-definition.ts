import type { FormDefinition } from "./form-definition.types";
import type { CanonicalDealShape } from "./source-paths/canonical-deal-shape";
import type { MapFormResult, MappedFieldEntry } from "./mapper.types";
import { formatPreviewValue, getValueAtPath } from "./utils/path-resolver";

const DRAFT: MapFormResult["draftNotice"] = "Draft assistance — broker review required.";

function firstResolved(paths: string[], root: unknown): { value: unknown; path: string; confidence: number } {
  for (const p of paths) {
    const v = getValueAtPath(root, p);
    if (v !== undefined && v !== null && v !== "") {
      return { value: v, path: p, confidence: 0.85 };
    }
  }
  return { value: undefined, path: paths[0] ?? "", confidence: 0.2 };
}

export function mapFormDefinition(def: FormDefinition, canonical: CanonicalDealShape): MapFormResult {
  const root = { deal: canonical.deal };
  const mappedFields: Record<string, unknown> = {};
  const fieldTrace: MappedFieldEntry[] = [];
  const missingRequiredKeys: string[] = [];
  const warnings: string[] = [];

  for (const sec of def.sections) {
    for (const field of sec.fields) {
      const { value, path, confidence } = firstResolved(field.sourcePaths, root);
      const unmapped = value === undefined || value === null || value === "";
      mappedFields[field.fieldKey] = value ?? "";
      fieldTrace.push({
        fieldKey: field.fieldKey,
        value: value ?? null,
        sourcePath: path,
        confidence,
        unmapped: !!unmapped || confidence < 0.5,
      });
      if (field.required && unmapped) {
        missingRequiredKeys.push(field.fieldKey);
      }
    }
  }

  if (missingRequiredKeys.length) {
    warnings.push(`Missing required mapped fields: ${missingRequiredKeys.slice(0, 8).join(", ")}${missingRequiredKeys.length > 8 ? "…" : ""}`);
  }

  return {
    formKey: def.formKey,
    officialCode: def.officialCode,
    draftNotice: DRAFT,
    mappedFields,
    fieldTrace,
    missingRequiredKeys,
    warnings,
  };
}

export function mappedFieldsToDisplay(mapped: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(mapped)) {
    out[k] = formatPreviewValue(v);
  }
  return out;
}

export type { MappedFieldEntry };
