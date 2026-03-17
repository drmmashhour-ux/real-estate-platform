/**
 * Parse land register document text: cadastre number, owner name, property address, municipality, lot number.
 * Uses regex patterns and structured parsing rules (Québec / generic French-style land register).
 */

const NORM = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-");

// Cadastre: numbers, optional letters/superscripts, fractions (e.g. 16 1/4), "Bloc 1", "Lot 50"
const CADASTRE_PATTERNS = [
  /\b(?:cadastre|numéro\s+de\s+lot|lot\s+no\.?|lot\s*#?)\s*[:\s]*([^\n,;]+?)(?=\n|$|,|;)/gi,
  /\b(?:lot|no\.?)\s*[:\s]*([\p{L}\p{N}\s\-/&.'()]+?)(?=\n|$|,|;)/gi,
  /\b(\d{4,12}(?:\s*[-/]\s*\d+)?(?:\s+\d+\s*\/\s*\d+)?)\s*(?:$|\n)/g,
];

// Owner: "propriétaire", "owner", "titulaire", "nom"
const OWNER_PATTERNS = [
  /\b(?:propriétaire|owner|titulaire|nom\s+du\s+propriétaire)\s*[:\s]*([^\n]+?)(?=\n\n|\n\w+\s*[:\s]|$)/gim,
  /\b(?:registered\s+owner|owner\s+name)\s*[:\s]*([^\n]+?)(?=\n|$)/gim,
  /(?:^|\n)\s*([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)+)\s*(?=\n\n|\n\d|$)/gm,
];

// Address: "adresse", "address", "situé", "emplacement"
const ADDRESS_PATTERNS = [
  /\b(?:adresse|address|situé\s+au|emplacement)\s*[:\s]*([^\n]+?)(?=\n\n|\n\w+\s*[:\s]|$)/gim,
  /\b(?:civique|street|rue|avenue|av\.?)\s*[:\s]*([^\n]+?)(?=\n|$)/gim,
  /(\d+\s+[^\n,]+(?:,\s*[^\n]+)?(?:,\s*(?:QC|Québec|Quebec))?)/g,
];

// Municipality: "municipalité", "ville", "city"
const MUNICIPALITY_PATTERNS = [
  /\b(?:municipalité|ville|city|municipality)\s*[:\s]*([^\n,]+?)(?=\n|,|$)/gim,
  /,\s*([A-Za-zÀ-Ÿà-ÿ\s\-']+?)\s*,\s*(?:QC|Québec|Quebec)/g,
];

// Lot number (may be same as cadastre in some docs)
const LOT_PATTERNS = [
  /\b(?:lot\s+no\.?|numéro\s+de\s+lot)\s*[:\s]*([^\n,]+?)(?=\n|,|$)/gim,
  /\blot\s*[#:]?\s*([\p{L}\p{N}\s\-/&.'()]+?)(?=\n|,|$)/gi,
];

function firstMatch(text: string, patterns: RegExp[]): string | null {
  const normalized = text.replace(/\r\n/g, "\n");
  for (const re of patterns) {
    const m = new RegExp(re.source, re.flags).exec(normalized);
    if (m?.[1]) {
      const v = m[1].trim();
      if (v.length > 0 && v.length < 500) return v;
    }
  }
  return null;
}

function allMatches(text: string, patterns: RegExp[]): string[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const re of patterns) {
    const regex = new RegExp(re.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = regex.exec(normalized)) !== null) {
      if (m[1]) {
        const v = m[1].trim();
        if (v.length > 1 && v.length < 500 && !seen.has(NORM(v))) {
          seen.add(NORM(v));
          out.push(v);
        }
      }
    }
  }
  return out;
}

export type ParsedLandRegister = {
  cadastre_number: string | null;
  owner_name: string | null;
  property_address: string | null;
  municipality: string | null;
  lot_number: string | null;
  confidence_score: number;
  raw_text_snippet: string;
};

export function parseLandRegisterText(text: string): ParsedLandRegister {
  const snippet = text.slice(0, 8000);
  const cadastre_number = firstMatch(snippet, CADASTRE_PATTERNS);
  const owner_name = firstMatch(snippet, OWNER_PATTERNS);
  const addressCandidates = allMatches(snippet, ADDRESS_PATTERNS);
  const property_address = addressCandidates[0] ?? null;
  const municipality = firstMatch(snippet, MUNICIPALITY_PATTERNS);
  const lot_number = firstMatch(snippet, LOT_PATTERNS) ?? cadastre_number;

  let confidence = 0;
  if (cadastre_number) confidence += 0.3;
  if (owner_name) confidence += 0.3;
  if (property_address) confidence += 0.25;
  if (municipality) confidence += 0.1;
  if (lot_number) confidence += 0.05;
  confidence = Math.min(1, confidence);

  return {
    cadastre_number,
    owner_name,
    property_address,
    municipality,
    lot_number,
    confidence_score: Math.round(confidence * 100) / 100,
    raw_text_snippet: snippet.slice(0, 2000),
  };
}
