/** Static BNHub stay demos for luxury marketing shells — not live inventory. */

export type LuxuryBnhubStayShowcase = {
  id: string;
  title: string;
  location: string;
  price: string;
  rating: string;
  guests: number;
  beds: number;
  baths: number;
  description: string;
  images: string[];
  amenities: string[];
  /** Illustrative line items for the reserve panel */
  serviceFeeDisplay: string;
  totalDemoDisplay: string;
};

const STAYS: LuxuryBnhubStayShowcase[] = [
  {
    id: "skyline-penthouse",
    title: "Skyline Penthouse Retreat",
    location: "Downtown Montréal",
    price: "$420 / night",
    rating: "4.95",
    guests: 4,
    beds: 2,
    baths: 2,
    description:
      "A refined penthouse stay with skyline views, curated interiors, premium finishes, and a calm, elevated atmosphere for luxury city escapes.",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80",
    ],
    amenities: [
      "Skyline terrace",
      "Concierge-ready check-in",
      "Premium kitchen",
      "Luxury bedding",
      "Fast Wi-Fi",
      "Secure parking",
    ],
    serviceFeeDisplay: "$60",
    totalDemoDisplay: "$900",
  },
  {
    id: "lakeside-escape",
    title: "Lakeside Modern Escape",
    location: "Laval-sur-le-Lac",
    price: "$360 / night",
    rating: "4.91",
    guests: 6,
    beds: 3,
    baths: 3,
    description:
      "Water-facing modern architecture with expansive glazing, serene lakeside mornings, and generous gathering spaces designed for restorative stays.",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=80",
    ],
    amenities: ["Private dock access", "Chef-ready kitchen", "Outdoor lounge", "Fire pit", "EV charger", "Boathouse"],
    serviceFeeDisplay: "$55",
    totalDemoDisplay: "$775",
  },
  {
    id: "old-port-loft",
    title: "Old Port Signature Loft",
    location: "Old Montréal",
    price: "$295 / night",
    rating: "4.88",
    guests: 3,
    beds: 1,
    baths: 1,
    description:
      "Historic stone context meets contemporary loft living — intimate scale, boutique styling, and walkable access to Vieux-Port dining and culture.",
    images: [
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&w=1400&q=80",
    ],
    amenities: ["Exposed brick & beams", "Rain shower", "Nespresso bar", "Workspace nook", "Bluetooth sound", "Courtyard view"],
    serviceFeeDisplay: "$45",
    totalDemoDisplay: "$635",
  },
];

const BY_ID: Record<string, LuxuryBnhubStayShowcase> = Object.fromEntries(STAYS.map((s) => [s.id, s]));

/** Numeric shortcuts for demos / marketing cards (`/bnhub/stays/1` → Skyline Penthouse). */
const SHOWCASE_ID_ALIASES: Record<string, string> = {
  "1": "skyline-penthouse",
  "2": "lakeside-escape",
  "3": "old-port-loft",
};

export function getLuxuryBnhubStayShowcase(id: string): LuxuryBnhubStayShowcase | null {
  const key = SHOWCASE_ID_ALIASES[id] ?? id;
  return BY_ID[key] ?? null;
}

export function listLuxuryBnhubStayShowcases(): LuxuryBnhubStayShowcase[] {
  return STAYS;
}
