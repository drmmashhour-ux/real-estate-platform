/** Static demo inventory for premium marketing shells — not live MLS data. */

export type LuxuryShowcaseProperty = {
  id: string;
  title: string;
  price: string;
  address: string;
  beds: number;
  baths: number;
  area: string;
  type: string;
  description: string;
  images: string[];
  amenities: string[];
  aiInsights: string[];
};

export const LUXURY_SHOWCASE_BY_ID: Record<string, LuxuryShowcaseProperty> = {
  "westmount-villa": {
    id: "westmount-villa",
    title: "Modern Villa in Westmount",
    price: "$3,750,000",
    address: "Westmount, Montréal, Québec",
    beds: 4,
    baths: 3,
    area: "4,850 sqft",
    type: "Single Family Residence",
    description:
      "A refined contemporary residence with floor-to-ceiling glazing, premium finishes, expansive living spaces, and a quiet luxury atmosphere designed for elevated city living.",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80",
    ],
    amenities: [
      "Indoor garage",
      "Private terrace",
      "Smart home system",
      "Wine cellar",
      "Heated floors",
      "Designer kitchen",
    ],
    aiInsights: [
      "Premium demand profile in this micro-market.",
      "Strong long-term value retention indicators.",
      "High-end finish quality supports upper pricing band.",
    ],
  },
};

export function getLuxuryShowcaseProperty(id: string): LuxuryShowcaseProperty | null {
  return LUXURY_SHOWCASE_BY_ID[id] ?? null;
}
