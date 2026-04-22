/** Senior Living Hub — lightweight map layer (optional, capped pins). */

export type SeniorMapPin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  priceLabel: string;
  careLevelLabel: string;
  detailHref: string;
  /** Short label inside pin: price snippet or omitted when using icon mode. */
  pinLabel: string;
  /** Show monthly price text when true; otherwise use care icon. */
  pinShowsPrice: boolean;
};

/** Senior-friendly cap — avoid clutter (spec 5–8). */
export const SENIOR_MAP_DEFAULT_MAX_PINS = 6;
export const SENIOR_MAP_NEARBY_MAX_PINS = 8;

export type LngLatBoundsLike = {
  west: number;
  south: number;
  east: number;
  north: number;
};
