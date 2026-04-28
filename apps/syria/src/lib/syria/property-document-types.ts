/** ORDER SYBNB-100 — Arabic-first labels; stable keys for DB `PropertyDocument.type`. */
export const PROPERTY_DOCUMENT_TYPE_KEYS = [
  "green_record",
  "court_judgment",
  "social_committee",
  "mandate",
  "sale_contract",
] as const;

export type PropertyDocumentTypeKey = (typeof PROPERTY_DOCUMENT_TYPE_KEYS)[number];

const KEY_SET = new Set<string>(PROPERTY_DOCUMENT_TYPE_KEYS);

export function isValidPropertyDocumentTypeKey(s: string | undefined | null): s is PropertyDocumentTypeKey {
  const t = (s ?? "").trim();
  return t.length > 0 && KEY_SET.has(t);
}
