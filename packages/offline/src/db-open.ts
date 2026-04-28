import { openDB, type IDBPDatabase } from "idb";

const SCHEMA_VERSION = 1;

/** Per-app namespace avoids collisions when multiple PWAs live on localhost or same origin. */
export function offlineDbName(namespace: string): string {
  const safe = namespace.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 48);
  return `lecipm-offline_${safe}_v${SCHEMA_VERSION}`;
}

/** Store names — never drop without a new DB version bump. */
export const STORES = {
  listings: "listings",
  bookings: "bookings",
  messages: "messages",
  meta: "meta",
  queue: "queue",
  apiSnapshots: "apiSnapshots",
} as const;

type MetaRow = {
  key: string;
  value: unknown;
  updatedAt: number;
};

type ListingRow<T = unknown> = { id: string; value: T; updatedAt: number };
type BookingRow<T = unknown> = { id: string; value: T; updatedAt: number };
type MessageRow<T = unknown> = { id: string; value: T; updatedAt: number };

let dbPromise: Record<string, Promise<IDBPDatabase<OfflineDB>>> = {};

/** Typed lightly so consumers can stash JSON-serializable blobs. */
export type OfflineIDB = IDBPDatabase<OfflineDB>;

export interface OfflineDB {
  [STORES.listings]: { key: string; value: ListingRow };
  [STORES.bookings]: { key: string; value: BookingRow };
  [STORES.messages]: { key: string; value: MessageRow };
  [STORES.meta]: { key: string; value: MetaRow };
  [STORES.queue]: { key: string; value: import("./types").OfflineAction };
  [STORES.apiSnapshots]: { key: string; value: { key: string; body: unknown; cachedAt: number } };
}

export async function openOfflineDexie(namespace: string): Promise<OfflineIDB> {
  const name = offlineDbName(namespace);
  const existing = dbPromise[name];
  if (existing) {
    return existing as Promise<OfflineIDB>;
  }
  const op = openDB<OfflineDB>(name, SCHEMA_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORES.listings)) {
        database.createObjectStore(STORES.listings, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(STORES.bookings)) {
        database.createObjectStore(STORES.bookings, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(STORES.messages)) {
        database.createObjectStore(STORES.messages, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(STORES.meta)) {
        database.createObjectStore(STORES.meta, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(STORES.queue)) {
        database.createObjectStore(STORES.queue, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(STORES.apiSnapshots)) {
        database.createObjectStore(STORES.apiSnapshots, { keyPath: "key" });
      }
    },
  });
  dbPromise[name] = op;
  return op;
}
