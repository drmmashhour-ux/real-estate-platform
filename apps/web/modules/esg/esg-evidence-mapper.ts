import type { ConflictReviewFlag } from "./esg-document-types";

export type EvidencePrecedence = "VERIFIED" | "ESTIMATED" | "UNCONFIRMED";

const rank: Record<string, number> = { VERIFIED: 3, ESTIMATED: 2, UNCONFIRMED: 1 };

export function verificationRank(v: string | null | undefined): number {
  return rank[v ?? ""] ?? 0;
}

/** Map certification string for EsgProfile.certification (LEED | WELL | null) */
export function mapCertificationToProfile(certType: string | null | undefined): string | null {
  if (!certType) return null;
  const u = certType.toUpperCase();
  if (u.includes("LEED")) return "LEED";
  if (u.includes("WELL")) return "WELL";
  return null;
}

export function shouldApplyProfilePatch(input: {
  fieldKey: string;
  newVerification: string;
  addressSimilarity: number;
  requiresAddress: boolean;
}): boolean {
  if (input.requiresAddress && input.addressSimilarity < 0.12) return false;
  return verificationRank(input.newVerification) >= verificationRank("ESTIMATED");
}

export function profilePatchFromEvidence(input: {
  certificationType: string | null;
  certificationLevel: string | null;
  renovationSignal: boolean;
  listingCertification: string | null;
}): {
  certification: string | null | undefined;
  renovation: boolean | undefined;
} {
  const mapped = mapCertificationToProfile(input.certificationType);
  const out: { certification: string | null | undefined; renovation: boolean | undefined } = {};
  if (mapped && verificationRank("VERIFIED") >= verificationRank("UNCONFIRMED")) {
    out.certification = mapped;
  }
  if (input.renovationSignal) out.renovation = true;
  return out;
}

export function mergeConflictLists(a: ConflictReviewFlag[], b: ConflictReviewFlag[]): ConflictReviewFlag[] {
  const seen = new Set<string>();
  const out: ConflictReviewFlag[] = [];
  for (const x of [...a, ...b]) {
    const k = `${x.fieldName}:${x.issue}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}
