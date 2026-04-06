import { getSellerDeclarationSections } from "@/src/modules/seller-declaration-ai/domain/declaration.schema";

export function computeDeclarationCompleteness(payload: Record<string, unknown>) {
  const allFields = getSellerDeclarationSections(payload).flatMap((s) => s.fields);
  let required = 0;
  let completed = 0;
  const missing: string[] = [];

  for (const field of allFields) {
    const shouldApply = !field.conditional || payload[field.conditional.fieldKey] === field.conditional.equals;
    if (!shouldApply) continue;
    if (field.required) required += 1;
    const value = payload[field.key];
    const hasValue = typeof value === "boolean" ? true : String(value ?? "").trim().length > 0;
    if (field.required && hasValue) completed += 1;
    if (field.required && !hasValue) missing.push(field.key);
  }

  const completenessPercent = required === 0 ? 100 : Math.round((completed / required) * 100);
  return { completenessPercent, missingFields: missing };
}
