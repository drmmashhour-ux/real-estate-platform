import { getListingWithHost } from "./listingService";

/**
 * Order 87 / 90 — `getListingWithHost` is the canonical implementation in `listingService`.
 */
export { getListingWithHost };

/** Legacy tuple shape `{ listing, host }`; prefer `getListingWithHost` for new code. */
export async function getMarketplaceListingWithMonolithHostById(listingId: string) {
  const r = await getListingWithHost(listingId);
  if (r == null) return { listing: null, host: null } as const;
  const { host, ...listing } = r;
  return { listing, host } as const;
}
