import type { FsboListing } from "@prisma/client";
import type { StrategySuggestion } from "./run-all-strategies";

export function mediaGapStrategy(ctx: { listing: Pick<FsboListing, "images"> }): StrategySuggestion[] {
  const n = ctx.listing.images?.length ?? 0;
  if (n >= 8) return [];
  return [
    {
      suggestionType: "media_gap",
      title: "Compléter la galerie avant promotion payante",
      summary: "Ajouter photos par pièce; éviter la promotion externe tant que la fiche est incomplète.",
      payload: { photoCount: n },
      confidence: 0.7,
      brokerApprovalRequired: false,
      whyNow: "Le nombre de photos est sous le seuil interne recommandé.",
      expectedBenefit: "Meilleure conversion organique sans dépense média gaspillée.",
      risksAndCautions: "Ne pas retoucher de façon trompeuse.",
    },
  ];
}
