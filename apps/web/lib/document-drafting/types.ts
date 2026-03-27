/**
 * Document Drafting – types and constants.
 */

export const DOCUMENT_TYPES = [
  "offer",
  "rental_agreement",
  "broker_agreement",
  "booking_confirmation",
  "investment_report",
  "verification_report",
  "transaction_summary",
  "dispute_report",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const RELATED_ENTITY_TYPES = ["transaction", "property", "listing", "booking", "dispute"] as const;
export type RelatedEntityType = (typeof RELATED_ENTITY_TYPES)[number];

export const OUTPUT_FORMATS = ["html", "pdf", "docx"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export const SIGNER_ROLES = ["buyer", "seller", "broker", "host", "guest", "admin"] as const;
export type SignerRole = (typeof SIGNER_ROLES)[number];

export interface SignatureField {
  signerRole: SignerRole;
  signerName: string;
  signerEmail: string;
  label?: string;
}

export interface DocumentGenerationContext {
  [key: string]: string | number | boolean | null | undefined | SignatureField[] | Record<string, unknown>[] | Record<string, unknown>;
}

export interface GenerationResult {
  contentHtml: string;
  signatureFields?: SignatureField[];
  changeSummary?: string;
}

export interface StoredDocument {
  id: string;
  documentType: string;
  relatedEntityType: string;
  relatedEntityId: string;
  generatedById: string;
  filePath: string | null;
  format: string;
  status: string;
  versionNumber: number;
  changeSummary: string | null;
  signatureFields: unknown;
  contentHtml: string | null;
  createdAt: Date;
}
