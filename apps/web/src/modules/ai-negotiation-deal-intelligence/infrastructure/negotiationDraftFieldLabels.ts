import { sellerDeclarationSections } from "@/src/modules/seller-declaration-ai/domain/declaration.schema";

export function fieldLabelFromKey(fieldKey: string): string {
  for (const sec of sellerDeclarationSections) {
    const f = sec.fields.find((x) => x.key === fieldKey);
    if (f) return f.label;
  }
  return fieldKey.replace(/_/g, " ");
}
