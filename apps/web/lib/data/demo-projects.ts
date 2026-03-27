/**
 * Safe fallback demo projects when DB is empty or project not found.
 */

/** Default coordinates for Montreal / Laval when project has none */
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Montreal: { lat: 45.5017, lng: -73.5673 },
  Laval: { lat: 45.6066, lng: -73.7243 },
};

export const DEMO_PROJECTS = [
  {
    id: "demo-1",
    name: "Lumiere Montreal",
    description:
      "Luxury high-rise in the heart of downtown Montreal. Premium finishes, concierge, and stunning city views.",
    city: "Montreal",
    address: "1234 Rue du Square-Victoria",
    developer: "Devimco",
    deliveryDate: new Date("2026-12-01").toISOString(),
    startingPrice: 450000,
    status: "upcoming",
    heroImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200",
    featured: true,
    featuredUntil: null as string | null,
    latitude: 45.5017,
    longitude: -73.5673,
    createdAt: new Date().toISOString(),
    units: [
      { id: "u1", projectId: "demo-1", type: "1bed", price: 450000, size: 55, status: "available" },
      { id: "u2", projectId: "demo-1", type: "2bed", price: 620000, size: 85, status: "available" },
    ],
  },
  {
    id: "demo-2",
    name: "Quartier Laval",
    description:
      "Modern mid-rise with green spaces and family-friendly amenities. Steps from metro.",
    city: "Laval",
    address: "500 Boulevard Saint-Martin",
    developer: "Broccolini",
    deliveryDate: new Date("2025-06-15").toISOString(),
    startingPrice: 380000,
    status: "under-construction",
    heroImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200",
    featured: false,
    featuredUntil: null as string | null,
    latitude: 45.6066,
    longitude: -73.7243,
    createdAt: new Date().toISOString(),
    units: [
      { id: "u3", projectId: "demo-2", type: "studio", price: 380000, size: 42, status: "available" },
      { id: "u4", projectId: "demo-2", type: "2bed", price: 520000, size: 78, status: "reserved" },
    ],
  },
];

export function getDemoProjectById(id: string) {
  return DEMO_PROJECTS.find((p) => p.id === id) ?? null;
}
