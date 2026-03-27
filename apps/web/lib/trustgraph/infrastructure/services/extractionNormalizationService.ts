import type { NormalizedExtractionPayload } from "@/lib/trustgraph/domain/extraction";

export function normalizeSellerDocumentExtraction(args: {
  sellerDeclarationJson: unknown;
  fileName: string;
  category: string;
}): { normalized: NormalizedExtractionPayload; confidence: number } {
  const decl = args.sellerDeclarationJson && typeof args.sellerDeclarationJson === "object" ? args.sellerDeclarationJson : {};
  const keys = Object.keys(decl as object);
  const propertyTypeHint =
    (decl as { propertyType?: string }).propertyType ??
    (keys.find((k) => k.toLowerCase().includes("type")) ? String((decl as Record<string, unknown>).propertyType ?? "") : null);

  const normalized: NormalizedExtractionPayload = {
    version: "1",
    propertyTypeHint: propertyTypeHint?.trim() ? propertyTypeHint.trim() : null,
    hasCoApplicantHint: null,
    incomeDocumentPresent: null,
    liabilitiesSectionPresent: keys.some((k) => k.toLowerCase().includes("liabilit")),
    idDocumentPresent: args.category === "IDENTITY",
    issueKeywords: [],
    rawMapping: { fileName: args.fileName, category: args.category, declarationKeys: keys },
  };

  const confidence = Math.min(0.95, 0.45 + keys.length * 0.04);
  return { normalized, confidence };
}

export function normalizeMortgageFileExtraction(args: {
  income: number;
  employmentStatus: string | null;
  creditRange: string | null;
}): { normalized: NormalizedExtractionPayload; confidence: number } {
  const normalized: NormalizedExtractionPayload = {
    version: "1",
    propertyTypeHint: null,
    hasCoApplicantHint: false,
    incomeDocumentPresent: args.income > 0,
    liabilitiesSectionPresent: args.creditRange != null && args.creditRange.length > 0,
    idDocumentPresent: null,
    issueKeywords: [],
    rawMapping: { employmentStatus: args.employmentStatus, creditRange: args.creditRange },
  };
  const confidence = 0.55 + (args.income > 0 ? 0.15 : 0) + (args.employmentStatus ? 0.1 : 0);
  return { normalized, confidence: Math.min(0.92, confidence) };
}
