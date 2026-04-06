/** Serializable STR listing snapshot for prompts (no secrets). */
export type PropertyMemorySnapshot = {
  id: string;
  title: string | null;
  city: string | null;
  nightPriceCents: number | null;
  instantBookEnabled: boolean | null;
  missingFields: string[];
};

export function listingToPropertyMemory(row: {
  id: string;
  title: string | null;
  city: string | null;
  nightPriceCents: number | null;
  instantBookEnabled: boolean | null;
  description: string | null;
  maxGuests: number | null;
}): PropertyMemorySnapshot {
  const missing: string[] = [];
  if (!row.title?.trim()) missing.push("title");
  if (!row.description?.trim()) missing.push("description");
  if (row.nightPriceCents == null || row.nightPriceCents <= 0) missing.push("price");
  if (row.maxGuests == null || row.maxGuests < 1) missing.push("maxGuests");
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    nightPriceCents: row.nightPriceCents,
    instantBookEnabled: row.instantBookEnabled,
    missingFields: missing,
  };
}
