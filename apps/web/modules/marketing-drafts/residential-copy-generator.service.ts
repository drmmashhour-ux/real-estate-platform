import type { FsboListing } from "@prisma/client";

function cadPrice(cents: number): string {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

/** Grounds copy only in listing fields — no invented features or market claims. */
export function buildJustListedDraft(listing: Pick<FsboListing, "title" | "city" | "priceCents" | "bedrooms" | "bathrooms" | "listingCode">): {
  title: string;
  body: string;
} {
  const code = listing.listingCode ? ` (${listing.listingCode})` : "";
  const title = `Nouvelle inscription résidentielle${code}`.trim();
  const beds = listing.bedrooms != null ? `${listing.bedrooms} ch.` : "—";
  const baths = listing.bathrooms != null ? `${listing.bathrooms} sdb` : "—";
  const body = [
    `Propriété résidentielle à ${listing.city}.`,
    `Prix affiché: ${cadPrice(listing.priceCents)}.`,
    `Pièces (selon fiche): ${beds}, ${baths}.`,
    "",
    "Les détails publiés sur la page du bien font foi. Aucune promesse de rendement ou d’urgence.",
  ].join("\n");
  return { title, body };
}

export function buildPriceUpdateDraft(
  listing: Pick<FsboListing, "title" | "city" | "priceCents">,
  previousPriceCents: number | null,
): { title: string; body: string } {
  const title = `Mise à jour du prix — ${listing.city}`;
  const prev =
    previousPriceCents != null
      ? `Ancien prix affiché: ${cadPrice(previousPriceCents)}.`
      : "Ancien prix: non disponible dans le système.";
  const body = [`${listing.title}`, "", prev, `Nouveau prix affiché: ${cadPrice(listing.priceCents)}.`].join("\n");
  return { title, body };
}

export function buildSeoMetaDraft(listing: Pick<FsboListing, "title" | "titleFr" | "city" | "propertyType">): {
  seoTitle: string;
  seoDescription: string;
} {
  const base = listing.titleFr?.trim() || listing.title;
  const seoTitle = `${base} | ${listing.city}`.slice(0, 60);
  const seoDescription = `Découvrez cette propriété résidentielle à ${listing.city}. Coordonnées sur la page du bien.`.slice(
    0,
    160,
  );
  return { seoTitle, seoDescription };
}
