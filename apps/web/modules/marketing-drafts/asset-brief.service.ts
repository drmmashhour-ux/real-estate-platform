import type { FsboListing } from "@prisma/client";

export function buildAssetBrief(listing: Pick<FsboListing, "title" | "city" | "images">): string {
  const n = listing.images?.length ?? 0;
  return [
    "Brief interne — médias",
    "",
    `Projet: ${listing.title} (${listing.city})`,
    `Photos actuellement chargées: ${n}.`,
    "Recommandation: couverture pièce par pièce, lumière naturelle, sans retouches trompeuses.",
  ].join("\n");
}
