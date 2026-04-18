import type { OaciqFormFamily } from "@prisma/client";
import type { FormDefinition } from "@/modules/oaciq-mapper/form-definition.types";
import { getFormDefinition } from "@/modules/oaciq-mapper/form-definition.registry";
import type { ExtractedPdfField } from "./pdf-field-extractor";

export type BuiltOaciqSchema = {
  formFamily: OaciqFormFamily;
  registryFormKey?: string;
  sections: Array<{
    sectionKey: string;
    sectionLabel: string;
    order: number;
    fields: Array<{
      fieldKey: string;
      label: string;
      fieldType: string;
      page?: number;
      required?: boolean;
      source: "pdf" | "registry" | "merged";
    }>;
  }>;
  disclaimer: string;
};

const FAMILY_TO_REGISTRY: Partial<Record<OaciqFormFamily, string>> = {
  PPG: "PP",
  CP: "CP",
  DS: "DS",
  IV: "IV",
  ANNEX_R: "RIS",
  ANNEX_RC: "RH",
};

/**
 * Build a JSON schema for persistence: prefer extracted PDF fields; optionally merge specimen registry fields by key (never invent keys).
 */
export function buildSchemaFromExtractedAndRegistry(
  formFamily: OaciqFormFamily,
  extracted: ExtractedPdfField[],
): BuiltOaciqSchema {
  const registryKey = FAMILY_TO_REGISTRY[formFamily];
  const reg: FormDefinition | undefined = registryKey ? getFormDefinition(registryKey) : undefined;

  const byKey = new Map<string, BuiltOaciqSchema["sections"][0]["fields"][0]>();

  for (const x of extracted) {
    const key = x.normalizedKey;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      fieldKey: key,
      label: x.label,
      fieldType: x.fieldType,
      page: x.page,
      required: x.required,
      source: "pdf",
    });
  }

  if (reg) {
    for (const sec of reg.sections) {
      for (const f of sec.fields) {
        if (byKey.has(f.fieldKey)) {
          const row = byKey.get(f.fieldKey)!;
          row.label = row.label || f.label;
          row.source = "merged";
        } else {
          byKey.set(f.fieldKey, {
            fieldKey: f.fieldKey,
            label: f.label,
            fieldType: f.fieldType,
            required: f.required,
            source: "registry",
          });
        }
      }
    }
  }

  const flat = [...byKey.values()];

  return {
    formFamily,
    registryFormKey: registryKey,
    sections: [
      {
        sectionKey: "extracted",
        sectionLabel: "Extracted fields",
        order: 0,
        fields: flat,
      },
    ],
    disclaimer:
      "Schema is built from AcroForm extraction and/or uploaded specimen registry keys only — no fabricated PDF fields.",
  };
}
