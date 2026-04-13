import type { SellerDeclarationData } from "@/lib/fsbo/seller-declaration-schema";

/**
 * Extra vision rules for the **first / cover** listing photo (security & buyer trust).
 * Set `FSBO_COVER_REQUIRE_VISIBLE_NUMBER=false` to require exterior only without enforcing visible digits (softer).
 */
export function buildCoverPhotoInstructions(propertyType: string | null | undefined): string {
  const pt = (propertyType ?? "").toUpperCase();

  if (pt === "LAND") {
    return `

COVER PHOTO (FIRST IN GALLERY) — LISTING TYPE: LAND / LOT
This must be an OUTDOOR shot of the land or lot (terrain, frontage, access road, boundaries, survey context). Pure interior is not acceptable.
Prefer a visible civic address on a post/mailbox at the lot entrance, lot sign, or stake; if the frame clearly shows the vacant parcel from the street/access and no number is in frame, you may still accept if it is clearly land for sale (not random scenery).`;
  }

  const requireVisibleNumber = process.env.FSBO_COVER_REQUIRE_VISIBLE_NUMBER !== "false";

  const numberBlock = requireVisibleNumber
    ? `2) Include a VISIBLE civic or building identifier buyers can match to the listing: digits of the street number on the facade, transom, mailbox at the property line, entrance pillar, building plaque with number/name+number, or tower entrance where numbers are legible in the image. If you cannot identify any digits or clear building number/plaque in the frame, choose suitable:false (image too tight on detail with no address context, or number not visible).
3) Be`
    : `2) Be`;

  const closing = requireVisibleNumber
    ? `If the building is shown from the street but digits are partly occluded or small yet still plausibly present on the entrance, you may accept. If there is clearly no number or identifier and no reasonable street-facing context, reject.`
    : `Choose suitable:false only if the shot is clearly not an exterior (or land) view suitable as a listing cover.`;

  return `

COVER PHOTO (FIRST IN GALLERY) — REQUIRED FOR NON-LAND LISTINGS
This image becomes the primary listing thumbnail. It MUST:
1) Show the OUTSIDE of the subject property or its street-facing presentation: house/townhouse facade, condo/apartment building exterior or main residential entrance (canopy, lobby entrance with building name/number), storefront/commercial facade, or plex exterior. A pure interior-only shot (kitchen, living room with no exterior context) is NOT acceptable as the cover photo.
${numberBlock} a genuine real-estate marketing shot (not unrelated art, food, or stock unrelated to the building).

${closing}`;
}

export function buildPhotoContextInstructions(propertyType: string | null | undefined): string {
  const pt = (propertyType ?? "").toUpperCase();
  if (!pt) return "";

  switch (pt) {
    case "CONDO":
      return `

LISTING TYPE: CONDOMINIUM / apartment (divided co-ownership).
The image must plausibly show THIS kind of home or its building: unit interior, balcony of a multi-unit building, condo lobby/hallway, tower or mid-rise facade, residential tower amenities, underground/indoor parking of a condo complex, or similar.
MISMATCH — set suitable:false if the MAIN subject is clearly: a detached suburban house with no multi-unit context, a mobile home/trailer/RV as the dwelling, or open farmland/lot with no building that could be a condo.`;

    case "SINGLE_FAMILY":
    case "TOWNHOUSE":
      return `

LISTING TYPE: SINGLE-FAMILY HOUSE or TOWNHOUSE (ground-oriented dwelling).
Photos should show the house, yard, street facade, or interior rooms of such a home.
MISMATCH — set suitable:false if the MAIN subject is clearly ONLY a high-rise apartment unit interior (tower only) or a mobile/trailer home when this listing is not for that type. Row/townhouse attached homes are OK.`;

    case "MULTI_FAMILY":
      return `

LISTING TYPE: MULTI-FAMILY / PLEX (duplex, triplex, etc.).
Show the building, facade, typical multi-unit entrances, or interior of a unit in a plex.`;

    case "LAND":
      return `

LISTING TYPE: VACANT LAND / LOT.
Prefer terrain, lot, road frontage, boundaries, aerial of land. MISMATCH — set suitable:false if the MAIN subject is clearly an unrelated interior residential room with no land context.`;

    case "COMMERCIAL":
      return `

LISTING TYPE: COMMERCIAL.
Show storefront, office, retail/industrial building, warehouse interior, loading area, or other commercial space appropriate to the listing. Warehouse or storage aisles can be suitable when marketing industrial/warehouse property.`;

    default:
      return "";
  }
}

/**
 * Non-blocking warnings for the Seller Hub UI when declaration and listing type diverge.
 */
export function getDeclarationListingConsistencyWarnings(
  d: SellerDeclarationData,
  listingPropertyType: string | null | undefined
): string[] {
  const warnings: string[] = [];
  const pt = (listingPropertyType ?? "").toUpperCase();
  const listingIsCondo = pt === "CONDO";

  if (listingIsCondo && !d.isCondo) {
    warnings.push(
      "Your listing is a condominium — turn on “divided co-ownership / condo” in the declaration (section 9) and use photos of the unit or building, not only a detached house."
    );
  }
  if (pt && !listingIsCondo && d.isCondo) {
    warnings.push(
      "Your declaration says divided co-ownership / condo, but the listing type is not set to condominium. Update the property type or adjust the declaration so they match."
    );
  }

  const unit = d.propertyAddressStructured?.unit?.trim();
  if (listingIsCondo && !unit) {
    warnings.push("Condo listings should include a unit / apartment number in the structured address (identity section).");
  }

  return warnings;
}
