/**
 * Client for document-ai service. Calls POST /analyze with PDF buffer.
 */

export type ExtractionResult = {
  cadastre_number: string | null;
  owner_name: string | null;
  property_address: string | null;
  municipality: string | null;
  lot_number: string | null;
  confidence_score: number;
  raw_text_snippet?: string;
  extracted_at?: string;
};

const DOCUMENT_AI_URL = process.env.DOCUMENT_AI_URL || "";

export async function analyzePdfBuffer(buffer: Buffer, documentId?: string): Promise<ExtractionResult> {
  if (!DOCUMENT_AI_URL) {
    return stubExtraction();
  }
  const form = new FormData();
  const pdfBytes = new Uint8Array(buffer);
  form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "document.pdf");
  if (documentId) form.append("document_id", documentId);
  const res = await fetch(`${DOCUMENT_AI_URL.replace(/\/$/, "")}/analyze`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Document AI failed: ${res.status}`);
  }
  return res.json() as Promise<ExtractionResult>;
}

function stubExtraction(): ExtractionResult {
  return {
    cadastre_number: null,
    owner_name: null,
    property_address: null,
    municipality: null,
    lot_number: null,
    confidence_score: 0,
  };
}
