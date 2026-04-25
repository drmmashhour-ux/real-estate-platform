/**
 * Standardized signature block for traceability (date, time, location, identity).
 * City is stored for display; "UNSPECIFIED" is an internal placeholder when not provided.
 */
export type SignatureBlock = {
  signerId: string;
  signerType: "broker" | "client";
  signedAt: Date;
  signedDate: string;
  signedTime: string;
  signedCity: string;
};

export function buildSignatureBlock(input: { signerId: string; signerType: "broker" | "client"; city?: string }): SignatureBlock {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");

  return {
    signerId: input.signerId,
    signerType: input.signerType,
    signedAt: now,
    signedDate: now.toISOString().slice(0, 10),
    signedTime: `${h}:${m}`,
    signedCity: input.city?.trim() || "UNSPECIFIED",
  };
}
