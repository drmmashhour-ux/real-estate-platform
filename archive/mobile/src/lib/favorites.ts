import * as SecureStore from "expo-secure-store";

const KEY = "bnhub_favorite_listing_ids_v1";

async function readIds(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

async function writeIds(ids: string[]): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(ids.slice(0, 200)));
}

export async function isFavoriteListing(listingId: string): Promise<boolean> {
  const ids = await readIds();
  return ids.includes(listingId);
}

export async function toggleFavoriteListing(listingId: string): Promise<boolean> {
  const ids = await readIds();
  const i = ids.indexOf(listingId);
  if (i >= 0) {
    ids.splice(i, 1);
    await writeIds(ids);
    return false;
  }
  ids.unshift(listingId);
  await writeIds(ids);
  return true;
}
