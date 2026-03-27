/**
 * Boundary for swapping map providers (Leaflet today; Mapbox/Google later).
 * Implement `MapSearch` with the same public props contract.
 */
export type MapBoundsWgs84 = { north: number; south: number; east: number; west: number };

export type MapSearchAdapterKind = "leaflet-osm";
