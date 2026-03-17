/**
 * Optional AI helper to analyze uploaded land register PDFs:
 * extract cadastre number, owner name, address, then compare with listing data.
 * Integrate with your PDF parser + LLM (e.g. AI_MANAGER) for production.
 */

export type ExtractedLandRegisterData = {
  cadastreNumber: string | null;
  ownerName: string | null;
  address: string | null;
  rawSnippet?: string;
};

export type CompareResult = {
  cadastreMatch: boolean;
  ownerNameMatch: boolean;
  addressMatch: boolean;
  allMatch: boolean;
  extracted: ExtractedLandRegisterData;
};

/**
 * Extract structured data from land register PDF content.
 * Default: returns null (no extraction). Replace with PDF text + LLM when available.
 */
export async function extractFromLandRegisterPdf(_params: {
  fileUrl: string;
  buffer?: Buffer;
}): Promise<ExtractedLandRegisterData> {
  // Optional: use pdf-parse or similar to get text, then call AI manager or regex
  // const text = await getPdfText(params.buffer ?? await fetchBuffer(params.fileUrl));
  // if (isAiManagerEnabled()) return callAiManager('/v1/ai-manager/land-register-extract', { text });
  return {
    cadastreNumber: null,
    ownerName: null,
    address: null,
  };
}

/**
 * Compare extracted document data with listing data.
 */
export function compareExtractWithListing(
  extracted: ExtractedLandRegisterData,
  listing: { cadastreNumber?: string | null; address?: string | null },
  userDisplayName: string | null
): CompareResult {
  const norm = (s: string | null | undefined) =>
    (s ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  const cadastreMatch =
    !!extracted.cadastreNumber &&
    !!listing.cadastreNumber &&
    norm(extracted.cadastreNumber) === norm(listing.cadastreNumber);
  const addressMatch =
    !!extracted.address &&
    !!listing.address &&
    (norm(extracted.address).includes(norm(listing.address)) ||
      norm(listing.address).includes(norm(extracted.address)));
  const ownerMatch =
    !!extracted.ownerName &&
    !!userDisplayName &&
    (norm(extracted.ownerName).includes(norm(userDisplayName)) ||
      norm(userDisplayName).includes(norm(extracted.ownerName)));
  return {
    cadastreMatch,
    ownerNameMatch: ownerMatch,
    addressMatch,
    allMatch: cadastreMatch && ownerMatch && addressMatch,
    extracted,
  };
}
