/**
 * Document AI extraction result and confidence.
 */

export type ExtractionResult = {
  cadastre_number: string | null;
  owner_name: string | null;
  property_address: string | null;
  municipality: string | null;
  lot_number: string | null;
  confidence_score: number; // 0-1
  raw_text_snippet?: string;
};

export type AnalyzeResponse = ExtractionResult & {
  document_id?: string;
  extracted_at: string; // ISO
};
