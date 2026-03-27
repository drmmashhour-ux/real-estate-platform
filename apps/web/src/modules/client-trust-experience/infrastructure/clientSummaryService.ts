import { sellerDeclarationSections } from "@/src/modules/seller-declaration-ai/domain/declaration.schema";

const PRICE_KEYS = ["list_price", "sale_price", "purchase_price", "asking_price", "price_cad"];

function pickPriceLine(payload: Record<string, unknown>): string | null {
  for (const key of PRICE_KEYS) {
    const v = payload[key];
    if (v === undefined || v === null || v === "") continue;
    const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(n) || n <= 0) {
      return `Price noted: ${String(v).trim()}`;
    }
    return `Listed price: ${n.toLocaleString("en-CA", { style: "currency", currency: "CAD" })}`;
  }
  return null;
}

function humanBool(v: unknown): boolean {
  return v === true || v === "true";
}

/**
 * Builds a short, plain-language summary from structured declaration fields only.
 * Does not invent facts beyond the payload.
 */
export function buildClientSummaryFromPayload(payload: Record<string, unknown>): {
  priceLine: string | null;
  conditions: string[];
  keyDates: string[];
  majorDeclarations: string[];
} {
  const priceLine = pickPriceLine(payload);

  const conditions: string[] = [];
  if (humanBool(payload.owner_occupied)) conditions.push("Owner-occupied.");
  else if (payload.owner_occupied === false || payload.owner_occupied === "false") conditions.push("Not owner-occupied.");
  if (humanBool(payload.tenant_present)) conditions.push("A tenant may be in place—see lease details.");
  if (String(payload.inclusions ?? "").trim()) conditions.push("Inclusions are listed in the document.");
  if (String(payload.exclusions ?? "").trim()) conditions.push("Exclusions are listed in the document.");

  const keyDates: string[] = [];
  const yb = String(payload.year_built ?? "").trim();
  if (yb) keyDates.push(`Year built (as stated): ${yb}`);

  const majorDeclarations: string[] = [];
  if (humanBool(payload.known_defects_flag)) majorDeclarations.push("Seller noted known defects.");
  if (humanBool(payload.water_damage_flag)) majorDeclarations.push("Seller noted water damage or infiltration.");
  if (humanBool(payload.structural_issues_flag)) majorDeclarations.push("Seller noted structural concerns.");
  if (humanBool(payload.legal_dispute_flag)) majorDeclarations.push("Seller noted legal disputes or claims.");
  if (humanBool(payload.environmental_flag)) majorDeclarations.push("Seller noted environmental concerns.");
  if (humanBool(payload.renovations_flag)) majorDeclarations.push("Seller noted renovations or repairs.");

  return { priceLine, conditions, keyDates, majorDeclarations };
}

export function buildSectionValuePreview(sectionKey: string, payload: Record<string, unknown>): string {
  const section = sellerDeclarationSections.find((s) => s.key === sectionKey);
  if (!section) return "";
  const parts: string[] = [];
  for (const f of section.fields) {
    if (f.conditional) {
      const condVal = payload[f.conditional.fieldKey];
      if (condVal !== f.conditional.equals) continue;
    }
    const v = payload[f.key];
    if (v === undefined || v === null || v === "") continue;
    const short =
      typeof v === "boolean" ? (v ? "Yes" : "No") : String(v).replace(/\s+/g, " ").trim().slice(0, 120);
    parts.push(`${f.label}: ${short}`);
  }
  return parts.slice(0, 4).join(" · ") || "—";
}
