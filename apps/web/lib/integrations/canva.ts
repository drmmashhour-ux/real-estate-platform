export type PosterInput = {
  title: string;
  price?: string;
  location?: string;
  image?: string;
  highlights?: string[];
};

export type DesignPayload = {
  listingId: string;
  title: string;
  description: string;
  price: string;
  location: string;
  images: string[];
  marketingHeadline: string;
  marketingBody: string;
};

/**
 * Returns a clean Canva poster editor URL. Users open Canva directly (blank/template editor),
 * not a platform page. No query params — clean editor only.
 */
export function buildCanvaEditorUrl(_payload?: DesignPayload): string {
  return "https://www.canva.com/create/posters/";
}

export function generateCanvaPayload(data: PosterInput): { payload: DesignPayload; designUrl: string } {
  const location = data.location ?? "";
  const price = data.price ?? "";
  const headline = data.title.slice(0, 60);
  const bodyLines = [data.title, location && `📍 ${location}`, price && `From ${price}`];
  if (data.highlights?.length) bodyLines.push(data.highlights.slice(0, 5).join(" · "));
  const body = bodyLines.filter(Boolean).join("\n").slice(0, 500);

  const payload: DesignPayload = {
    listingId: "",
    title: data.title,
    description: body,
    price,
    location,
    images: data.image ? [data.image] : [],
    marketingHeadline: headline,
    marketingBody: body,
  };
  const designUrl = buildCanvaEditorUrl(payload);
  return { payload, designUrl };
}
