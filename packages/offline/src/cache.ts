import { STORES, openOfflineDexie, type OfflineIDB } from "./db-open";

async function namespaceToDb(namespace: string): Promise<OfflineIDB> {
  return openOfflineDexie(namespace);
}

export async function putListing(namespace: string, id: string, value: unknown): Promise<void> {
  const db = await namespaceToDb(namespace);
  const tx = db.transaction(STORES.listings, "readwrite");
  await tx.store.put({ id, value, updatedAt: Date.now() });
  await tx.done;
}

/** Bulk upsert for browse payloads */
export async function upsertListingMany(namespace: string, rows: Map<string, unknown>): Promise<void> {
  const db = await namespaceToDb(namespace);
  const tx = db.transaction(STORES.listings, "readwrite");
  const store = tx.store;
  const now = Date.now();
  for (const [id, value] of rows) {
    await store.put({ id, value, updatedAt: now });
  }
  await tx.done;
}

export async function getListing<T = unknown>(namespace: string, id: string): Promise<T | undefined> {
  const db = await namespaceToDb(namespace);
  const row = (await db.get(STORES.listings as never, id)) as { value: unknown } | undefined;
  return row?.value != null ? (row.value as T) : undefined;
}

export async function getAllListingIds(namespace: string): Promise<string[]> {
  const db = await namespaceToDb(namespace);
  const keys = await db.getAllKeys(STORES.listings as never);
  return keys.map((k) => String(k));
}

export async function putBooking(namespace: string, id: string, value: unknown): Promise<void> {
  const db = await namespaceToDb(namespace);
  const tx = db.transaction(STORES.bookings, "readwrite");
  await tx.store.put({ id, value, updatedAt: Date.now() });
  await tx.done;
}

export async function getBooking<T = unknown>(namespace: string, id: string): Promise<T | undefined> {
  const db = await namespaceToDb(namespace);
  const row = (await db.get(STORES.bookings as never, id)) as { value: unknown } | undefined;
  return row?.value != null ? (row.value as T) : undefined;
}

export async function putMessage(namespace: string, id: string, value: unknown): Promise<void> {
  const db = await namespaceToDb(namespace);
  const tx = db.transaction(STORES.messages, "readwrite");
  await tx.store.put({ id, value, updatedAt: Date.now() });
  await tx.done;
}

export async function listMessages(namespace: string): Promise<Array<{ id: string; value: unknown; updatedAt: number }>> {
  const db = await namespaceToDb(namespace);
  const rows = (await db.getAll(STORES.messages as never)) as Array<{ id: string; value: unknown; updatedAt: number }>;
  return rows.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function putMeta(namespace: string, key: string, value: unknown): Promise<void> {
  const db = await namespaceToDb(namespace);
  const tx = db.transaction(STORES.meta, "readwrite");
  await tx.store.put({ key, value, updatedAt: Date.now() });
  await tx.done;
}

export async function getMeta<T = unknown>(namespace: string, key: string): Promise<T | undefined> {
  const db = await namespaceToDb(namespace);
  const row = (await db.get(STORES.meta as never, key)) as { value?: unknown } | undefined;
  return row?.value != null ? (row.value as T) : undefined;
}

export async function putApiSnapshot(namespace: string, key: string, body: unknown): Promise<void> {
  const db = await namespaceToDb(namespace);
  const tx = db.transaction(STORES.apiSnapshots, "readwrite");
  await tx.store.put({ key, body, cachedAt: Date.now() });
  await tx.done;
}

export async function getApiSnapshot<T = unknown>(namespace: string, key: string): Promise<T | undefined> {
  const db = await namespaceToDb(namespace);
  const row = (await db.get(STORES.apiSnapshots as never, key)) as { body?: unknown } | undefined;
  return row?.body != null ? (row.body as T) : undefined;
}
