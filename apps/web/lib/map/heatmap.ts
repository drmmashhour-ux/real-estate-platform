export type HeatmapPoint = {
  lat: number;
  lng: number;
  value: number;
};

export function buildHeatmapData(comps: { latitude: number | null; longitude: number | null; priceCents: number }[]) {
  return comps
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      lat: c.latitude as number,
      lng: c.longitude as number,
      value: c.priceCents,
    }));
}

export function compsToHeatmapFeatureCollection(
  comps: { latitude: number | null; longitude: number | null; priceCents: number }[],
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = comps
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      type: "Feature",
      properties: {
        price: c.priceCents,
      },
      geometry: {
        type: "Point",
        coordinates: [c.longitude as number, c.latitude as number],
      },
    }));

  return { type: "FeatureCollection", features };
}
