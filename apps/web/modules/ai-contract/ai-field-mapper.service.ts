import type { FormDefinition } from "@/modules/oaciq-mapper/form-definition.types";
import { getFormDefinition } from "@/modules/oaciq-mapper/form-definition.registry";

export type MappedFieldConfidence = {
  fieldKey: string;
  value: unknown;
  confidence: number;
  dropped?: boolean;
  reason?: string;
};

export type StrictMapResult = {
  formType: string;
  mappedFields: Record<string, unknown>;
  confidences: MappedFieldConfidence[];
  droppedKeys: string[];
  disclaimer: string;
};

function collectAllowedKeys(def: FormDefinition): Set<string> {
  const keys = new Set<string>();
  for (const s of def.sections) {
    for (const f of s.fields) {
      keys.add(f.fieldKey);
    }
  }
  return keys;
}

/**
 * Filters arbitrary candidate key/value pairs to registry field keys only — never passes through unknown keys.
 */
export function mapAiOutputToRegistryStrict(
  formKey: string,
  candidate: Record<string, unknown>,
  confidenceDefault = 0.7,
): StrictMapResult {
  const def = getFormDefinition(formKey);
  if (!def) {
    return {
      formType: formKey,
      mappedFields: {},
      confidences: [],
      droppedKeys: Object.keys(candidate),
      disclaimer: "Unknown formKey — no registry definition; all candidate keys dropped.",
    };
  }

  const allowed = collectAllowedKeys(def);
  const mappedFields: Record<string, unknown> = {};
  const confidences: MappedFieldConfidence[] = [];
  const droppedKeys: string[] = [];

  for (const [k, v] of Object.entries(candidate)) {
    if (!allowed.has(k)) {
      droppedKeys.push(k);
      confidences.push({ fieldKey: k, value: v, confidence: 0, dropped: true, reason: "not_in_registry" });
      continue;
    }
    mappedFields[k] = v;
    confidences.push({ fieldKey: k, value: v, confidence: confidenceDefault });
  }

  return {
    formType: def.formKey,
    mappedFields,
    confidences,
    droppedKeys,
    disclaimer:
      "Strict mapper: only keys present in the uploaded specimen registry were retained. Broker must verify every value against the official OACIQ form.",
  };
}
