/**
 * Listing vs certificate structured-field comparison — null when insufficient data (not "false").
 */

import type {
  CertificateOfLocationConsistencySignals,
  CertificateOfLocationContext,
  CertificateOfLocationParsedData,
} from "./certificate-of-location.types";

function normAddr(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[,#]/g, "")
    .trim();
}

function tokensMatch(a: string, b: string): boolean {
  const aa = normAddr(a);
  const bb = normAddr(b);
  if (!aa || !bb) return false;
  if (aa === bb) return true;
  const ta = aa.split(" ").filter((x) => x.length > 2);
  const tb = bb.split(" ").filter((x) => x.length > 2);
  let overlap = 0;
  for (const x of ta) {
    if (tb.includes(x)) overlap++;
  }
  return overlap >= 2 || (ta.length >= 2 && overlap >= 1 && aa.length > 12 && bb.length > 12);
}

function normLot(s: string): string {
  return s.replace(/\s+/g, "").toUpperCase();
}

export function validateCertificateConsistency(
  parsedData: CertificateOfLocationParsedData,
  context: CertificateOfLocationContext,
): CertificateOfLocationConsistencySignals {
  try {
    const mismatches: string[] = [];
    let addressMatchesListing: boolean | null = null;
    let lotMatchesListing: boolean | null = null;

    const listingLine = [context.listingAddress, context.listingCity].filter(Boolean).join(" ").trim();
    const certAddr = parsedData.address ?? "";
    const certMuni = parsedData.municipality ?? "";

    if (listingLine && (certAddr || certMuni)) {
      const combinedCert = `${certAddr} ${certMuni}`.trim();
      const hit =
        tokensMatch(listingLine, combinedCert) ||
        (certMuni && tokensMatch(listingLine, certMuni)) ||
        (certAddr && tokensMatch(listingLine, certAddr));
      addressMatchesListing = hit;
      if (!hit) {
        mismatches.push("address_mismatch_listing_vs_certificate_metadata");
      }
    }

    const cad = context.listingCadastre?.trim();
    const lot = parsedData.lotNumber?.trim();
    if (cad && lot) {
      lotMatchesListing = normLot(cad) === normLot(lot) || cad.includes(lot) || lot.includes(cad);
      if (!lotMatchesListing) {
        mismatches.push("cadastre_or_lot_reference_mismatch");
      }
    }

    return {
      addressMatchesListing,
      lotMatchesListing,
      mismatches,
    };
  } catch {
    return {
      addressMatchesListing: null,
      lotMatchesListing: null,
      mismatches: [],
    };
  }
}
