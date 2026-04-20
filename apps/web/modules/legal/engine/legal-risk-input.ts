import type { FsboListing } from "@prisma/client";
import type { LegalRiskEngineInput } from "./legal-engine.service";

const PLACEHOLDER_DRAFT =
  "Complete your listing in Seller Hub — add details, photos, seller declaration, documents, and sign contracts before submitting for review.";

const HIGH_VALUE_CENTS = 50_000_000; // $500,000.00 when using dollars*100 style (see existing deal seeds)

function textMentionsRoof(text: string): boolean {
  return /roof|toiture|toit|elastomer|shingle|bardeau/i.test(text);
}

/**
 * Heuristic input for FSBO listing lifecycle — draft listings lack a completed seller declaration → inspection/disclosure gaps.
 */
export function buildLegalRiskInputFromFsboListing(
  listing: Pick<FsboListing, "title" | "description" | "priceCents" | "surfaceSqft" | "status">,
): LegalRiskEngineInput {
  const full = `${listing.title}\n${listing.description}`.trim();

  const roofUnknown =
    !textMentionsRoof(full) &&
    (listing.surfaceSqft != null ? listing.surfaceSqft > 1200 : false);

  return {
    roofConditionUnknown: roofUnknown,
    highValueProperty: listing.priceCents >= HIGH_VALUE_CENTS,
    sellerProvidedInfo: full.length > 20,
    incompleteDisclosure: full.includes(PLACEHOLDER_DRAFT) || full.length < 80,
    inspectionLimited: listing.status === "DRAFT",
    sellerSilenceDuringInspection: false,
  };
}

export function buildLegalRiskInputFromBnhubCreate(body: {
  title: string;
  description?: string | null;
  price: number;
  location: string;
}): LegalRiskEngineInput {
  const desc = (body.description ?? "").trim();
  return {
    highValueProperty: Number(body.price) >= 400,
    sellerProvidedInfo: desc.length > 10,
    incompleteDisclosure: desc.length < 40,
    roofConditionUnknown: !/roof|ceiling|garden|jardin|exterior/i.test(`${body.title} ${desc} ${body.location}`),
    inspectionLimited: false,
    sellerSilenceDuringInspection: false,
  };
}

export function buildLegalRiskInputFromSellerOnboarding(merged: Record<string, unknown>): LegalRiskEngineInput {
  const ownership = merged.ownershipConfirmed;
  return {
    sellerProvidedInfo: true,
    incompleteDisclosure: ownership !== true,
    inspectionLimited: false,
    sellerSilenceDuringInspection: false,
    roofConditionUnknown: false,
    highValueProperty: false,
  };
}
