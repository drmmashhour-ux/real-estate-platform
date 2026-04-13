export type SimilarListingCard = {
  id: string;
  listingCode: string;
  title: string;
  city: string;
  country: string;
  beds: number;
  baths: number;
  nightPriceCents: number;
  propertyType: string | null;
  coverUrl: string | null;
};

export function toSimilarListingCards(
  rows: {
    id: string;
    listingCode: string;
    title: string;
    city: string;
    country: string;
    beds: number;
    baths: number;
    nightPriceCents: number;
    propertyType: string | null;
    photos: unknown;
    listingPhotos: { url: string }[];
  }[]
): SimilarListingCard[] {
  return rows.map((l) => {
    const fromPhotos = l.listingPhotos[0]?.url;
    const legacy = Array.isArray(l.photos) && l.photos.length ? String((l.photos as string[])[0]) : null;
    return {
      id: l.id,
      listingCode: l.listingCode,
      title: l.title,
      city: l.city,
      country: l.country,
      beds: l.beds,
      baths: l.baths,
      nightPriceCents: l.nightPriceCents,
      propertyType: l.propertyType,
      coverUrl: fromPhotos ?? legacy,
    };
  });
}
