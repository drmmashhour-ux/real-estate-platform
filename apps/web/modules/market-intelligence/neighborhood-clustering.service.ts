/**
 * Buckets Montreal-area listings into neighborhoods using municipality / neighborhoodDetails / borough keywords.
 * Does not geocode — labels are only as precise as host-provided data.
 */

import type { Prisma } from "@prisma/client";

/** Known Island of Montréal borough / area keywords (display labels, not population stats). */
export const MONTREAL_AREA_KEYWORDS: { label: string; match: RegExp }[] = [
  { label: "Plateau–Mont-Royal", match: /plateau|plateau-mont-royal|le plateau/i },
  { label: "Rosemont–La Petite-Patrie", match: /rosemont|petite-patrie|petite patrie/i },
  { label: "Ville-Marie", match: /ville-marie|downtown|centre-ville|old montreal|vieux-montréal|vieux montreal|griffintown|quartier des spectacles/i },
  { label: "Sud-Ouest", match: /sud-ouest|st-henri|saint-henri|pointe-saint-charles|pointe st-charles|little burgundy/i },
  { label: "Côte-des-Neiges–Notre-Dame-de-Grâce", match: /côte-des-neiges|cdn|ndg|notre-dame-de-grâce|notre dame de grace/i },
  { label: "Villeray–Saint-Michel–Parc-Extension", match: /villeray|saint-michel|parc-extension|parc ext/i },
  { label: "Ahuntsic-Cartierville", match: /ahuntsic|cartierville/i },
  { label: "Mercier–Hochelaga-Maisonneuve", match: /hochelaga|mercier|maisonneuve|hochelaga-maisonneuve/i },
  { label: "Lachine / LaSalle", match: /\blachine\b|\blasalle\b/i },
  { label: "Montréal-Nord", match: /montréal-nord|montreal-nord/i },
  { label: "Rivière-des-Prairies–Pointe-aux-Trembles", match: /pointe-aux-trembles|rivière-des-prairies|rdp|pat/i },
  { label: "Saint-Laurent", match: /\bsaint-laurent\b|\bst-laurent\b/i },
  { label: "Pierrefonds-Roxboro–Île-Bizard–Sainte-Geneviève", match: /pierrefonds|roxboro|île-bizard|sainte-geneviève|ile bizard/i },
];

export function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Prefer municipality when present; else match known area keywords in neighborhoodDetails or address; else “Montréal (unspecified)”.
 */
export function bucketNeighborhood(input: {
  municipality: string | null | undefined;
  neighborhoodDetails: string | null | undefined;
  address: string;
}): string {
  const m = input.municipality?.trim();
  if (m && m.length > 1) return normalizeWhitespace(m);

  const blob = [input.neighborhoodDetails, input.address].filter(Boolean).join(" ");
  for (const { label, match } of MONTREAL_AREA_KEYWORDS) {
    if (match.test(blob)) return label;
  }
  return "Montréal (unspecified)";
}

export function prismaWhereMontrealShortTerm(): Prisma.ShortTermListingWhereInput {
  return {
    OR: [
      { city: { equals: "Montreal", mode: "insensitive" } },
      { city: { equals: "Montréal", mode: "insensitive" } },
      { city: { contains: "Montreal", mode: "insensitive" } },
      { city: { contains: "Montréal", mode: "insensitive" } },
    ],
  };
}

export function prismaWhereMontrealFsbo(): Prisma.FsboListingWhereInput {
  return {
    OR: [
      { city: { equals: "Montreal", mode: "insensitive" } },
      { city: { equals: "Montréal", mode: "insensitive" } },
      { city: { contains: "Montreal", mode: "insensitive" } },
      { city: { contains: "Montréal", mode: "insensitive" } },
    ],
  };
}

export function nightPriceToBand(nightCents: number): import("./market-intelligence.types").PriceBand {
  if (nightCents < 80_00) return "budget";
  if (nightCents < 160_00) return "mid";
  if (nightCents < 280_00) return "premium";
  return "luxury";
}
