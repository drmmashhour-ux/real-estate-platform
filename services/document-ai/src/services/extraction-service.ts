/**
 * Document extraction pipeline: PDF → text → structured fields.
 */

import { extractTextFromPdf } from "../parsers/pdf-parser.js";
import { parseLandRegisterText, type ParsedLandRegister } from "../parsers/land-register-parser.js";
import type { ExtractionResult } from "../models/types.js";

export async function extractFromPdfBuffer(buffer: Buffer): Promise<ExtractionResult> {
  const { text } = await extractTextFromPdf(buffer);
  const parsed: ParsedLandRegister = parseLandRegisterText(text);
  return {
    cadastre_number: parsed.cadastre_number,
    owner_name: parsed.owner_name,
    property_address: parsed.property_address,
    municipality: parsed.municipality,
    lot_number: parsed.lot_number,
    confidence_score: parsed.confidence_score,
    raw_text_snippet: parsed.raw_text_snippet,
  };
}
