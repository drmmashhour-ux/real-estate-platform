/**
 * Advisory listing quality suggestions — templates + heuristics only.
 * Hosts review and edit; nothing is applied automatically from this module.
 */

export type ListingOptimizerInput = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  propertyType: string | null;
  beds: number;
  amenities: string[];
  /** Count of structured gallery photos */
  structuredPhotoCount: number;
  /** Legacy JSON photo URLs count */
  legacyPhotoUrlCount: number;
};

export type ListingOptimizerResult = {
  suggestedTitle: string | null;
  suggestedDescription: string | null;
  missingAmenities: string[];
  photoImprovements: string[];
  reasoning: string[];
};

const AMENITY_CANON = [
  { keys: ["wifi", "wi-fi", "internet"], label: "Wi-Fi" },
  { keys: ["kitchen", "cuisine"], label: "Kitchen" },
  { keys: ["washer", "washing", "laundry"], label: "Washer" },
  { keys: ["dryer", "sèche-linge"], label: "Dryer" },
  { keys: ["air conditioning", "ac", "climatisation", "a/c"], label: "Air conditioning" },
  { keys: ["heating", "chauffage", "heat"], label: "Heating" },
  { keys: ["tv", "television"], label: "TV" },
  { keys: ["smoke alarm", "détecteur fumée"], label: "Smoke alarm" },
  { keys: ["carbon monoxide", "co detector"], label: "Carbon monoxide alarm" },
  { keys: ["hair dryer", "sèche-cheveux"], label: "Hair dryer" },
  { keys: ["iron", "fer à repasser"], label: "Iron" },
  { keys: ["workspace", "desk", "bureau"], label: "Dedicated workspace" },
] as const;

function norm(s: string) {
  return s.trim().toLowerCase();
}

function amenityPresent(am: (typeof AMENITY_CANON)[number], haystack: string[]) {
  return haystack.some((h) => am.keys.some((k) => norm(h).includes(k)));
}

function totalPhotos(input: ListingOptimizerInput) {
  return Math.max(input.structuredPhotoCount, input.legacyPhotoUrlCount);
}

/**
 * Produces editable suggestions and plain-language reasoning.
 */
export function runListingOptimizer(input: ListingOptimizerInput): ListingOptimizerResult {
  const reasoning: string[] = [];
  const haystack = input.amenities.map(norm);
  const missing: string[] = [];
  for (const am of AMENITY_CANON) {
    if (!amenityPresent(am, haystack)) missing.push(am.label);
  }
  const missingAmenities = missing.slice(0, 6);

  if (missingAmenities.length > 0) {
    reasoning.push(
      `Guests often filter by essentials. Consider adding accurate amenities you actually provide (${missingAmenities.slice(0, 3).join(", ")}${missingAmenities.length > 3 ? ", …" : ""}).`,
    );
  }

  let suggestedTitle: string | null = null;
  const t = input.title.trim();
  const city = input.city.trim();
  const prop = (input.propertyType ?? "Stay").trim();
  const beds = Math.max(1, input.beds);
  if (t.length < 12) {
    suggestedTitle = `${prop} in ${city} · ${beds} bed${beds > 1 ? "s" : ""}`;
    reasoning.push("Title is very short; a clearer headline with property type, city, and capacity usually improves clicks.");
  } else if (city && !norm(t).includes(norm(city))) {
    suggestedTitle = `${t} — ${city}`;
    reasoning.push("Adding the city to the title helps guests confirm location at a glance in search results.");
  } else if (t === t.toUpperCase() && t.length > 15) {
    suggestedTitle = t.charAt(0) + t.slice(1).toLowerCase();
    reasoning.push("Mixed case reads more professionally than all caps.");
  }

  let suggestedDescription: string | null = null;
  const d = (input.description ?? "").trim();
  if (d.length < 160) {
    suggestedDescription = [
      `Welcome to ${prop} in ${city}.`,
      "",
      "The space: briefly describe layout, sleeping arrangements, and standout features.",
      "",
      "Guest access: parking, check-in method, Wi-Fi placement, and any stairs or accessibility notes.",
      "",
      "Neighborhood: 2–3 sentences on what guests can walk to (cafés, transit, waterfront, etc.).",
      "",
      "House rules recap: quiet hours, trash, and anything unique to your home.",
    ].join("\n");
    reasoning.push(
      "Description is thin; expanding with space, access, and neighborhood blocks builds trust and reduces pre-stay messages.",
    );
  } else if (!/neighbour|neighbor|quartier|district|walk/i.test(d)) {
    suggestedDescription = `${d}\n\nNeighborhood: add a short note on what is walkable nearby (transit, coffee, groceries) so guests can picture the stay.`;
    reasoning.push("Adding a neighborhood paragraph often improves conversion when the rest of the copy is strong.");
  }

  const photoImprovements: string[] = [];
  const nPhotos = totalPhotos(input);
  if (nPhotos < 5) {
    photoImprovements.push("Add at least 5 high-quality photos: cover exterior or main living, kitchen, bedrooms, bathroom, and a detail shot.");
    reasoning.push("Listings with broader photo coverage typically earn more trust; aim for 8+ when possible.");
  }
  if (nPhotos >= 5 && nPhotos < 8) {
    photoImprovements.push("Consider 2–3 more angles: natural light daytime shots and a wide living-room frame.");
  }
  if (input.structuredPhotoCount === 0 && input.legacyPhotoUrlCount > 0) {
    photoImprovements.push("Migrate photos into the ordered gallery so the cover image and ordering are intentional.");
    reasoning.push("Ordered gallery photos control which image guests see first in search.");
  }

  if (reasoning.length === 0) {
    reasoning.push("Core listing fields look healthy; keep photos fresh and revisit seasonality in pricing.");
  }

  return {
    suggestedTitle,
    suggestedDescription,
    missingAmenities,
    photoImprovements,
    reasoning,
  };
}

export function parseAmenitiesJson(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

export function legacyPhotoUrlCount(raw: unknown): number {
  if (!Array.isArray(raw)) return 0;
  return raw.filter((x) => typeof x === "string" && x.trim().length > 4).length;
}
