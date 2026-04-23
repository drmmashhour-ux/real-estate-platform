import { generateDocumentHash } from "@/lib/compliance/document-hash";

export type SignaturePayload = {
  signerId: string;
  signerType: "broker" | "client";
  signedAt?: Date;
  signedDate: string;
  signedTime: string;
  signedCity: string;
};

export function buildSignature(input: { signerId: string; signerType: "broker" | "client"; city?: string }): SignaturePayload {
  const now = new Date();

  return {
    signerId: input.signerId,
    signerType: input.signerType,
    signedAt: now,
    signedDate: now.toISOString().slice(0, 10),
    signedTime: now.toTimeString().slice(0, 5),
    signedCity: input.city?.trim() || "Laval",
  };
}

export { generateDocumentHash } from "@/lib/compliance/document-hash";

/** @deprecated use generateDocumentHash */
export const hashDoc = generateDocumentHash;

/** Regulator-safe release checks — identity of signer, calendar trace, document integrity. */
export function assertSignatureReleaseRules(
  signature: SignaturePayload | null | undefined,
  documentHash: string | null | undefined,
): void {
  if (!signature?.signerId?.trim()) {
    throw new Error("SIGNER_REQUIRED");
  }
  if (!signature.signedDate?.trim()) {
    throw new Error("SIGNATURE_DATE_REQUIRED");
  }
  if (!signature.signedTime?.trim()) {
    throw new Error("SIGNATURE_TIME_REQUIRED");
  }
  if (!signature.signedCity?.trim()) {
    throw new Error("SIGNATURE_CITY_REQUIRED");
  }
  if (!documentHash?.trim()) {
    throw new Error("DOCUMENT_HASH_REQUIRED");
  }
}

/** Binding hash for the signature act (method + key fields), distinct from document body hash when both are stored. */
export function computeSignatureRecordHash(parts: {
  signerId: string;
  signerType: string;
  signedAtIso: string;
  signatureMethod: string;
  documentHash: string;
}): string {
  return generateDocumentHash(
    [parts.signerId, parts.signerType, parts.signedAtIso, parts.signatureMethod, parts.documentHash].join("|"),
  );
}
