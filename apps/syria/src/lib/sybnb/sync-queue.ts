/**
 * Unified SYBNB outbound sync queue — localStorage (`sybnb_sync_queue`).
 * Processed sequentially by `sync-engine.ts` — max {@link SYBNB_SYNC_QUEUE_MAX} items.
 */

export const SYBNB_SYNC_QUEUE_KEY = "sybnb_sync_queue";

/** Align with sync-engine / UX caps. */
export const SYBNB_SYNC_QUEUE_MAX = 100;

export type SybnbSyncQueueItem = {
  id: string;
  type: "message" | "booking_action";
  payload: Record<string, unknown>;
  createdAt: number;
  retries: number;
  failed?: boolean;
  /** True while a tab is actively POSTing this row — persisted to avoid duplicate sends after crash/refresh. */
  processing?: boolean;
};

function safeParse(raw: string | null): SybnbSyncQueueItem[] {
  if (raw == null || raw === "") return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const out: SybnbSyncQueueItem[] = [];
    for (const row of v) {
      if (
        row &&
        typeof row === "object" &&
        typeof (row as SybnbSyncQueueItem).id === "string" &&
        ((row as SybnbSyncQueueItem).type === "message" || (row as SybnbSyncQueueItem).type === "booking_action") &&
        typeof (row as SybnbSyncQueueItem).payload === "object" &&
        (row as SybnbSyncQueueItem).payload != null &&
        typeof (row as SybnbSyncQueueItem).createdAt === "number" &&
        typeof (row as SybnbSyncQueueItem).retries === "number"
      ) {
        out.push({
          id: (row as SybnbSyncQueueItem).id,
          type: (row as SybnbSyncQueueItem).type,
          payload: { ...(row as SybnbSyncQueueItem).payload },
          createdAt: (row as SybnbSyncQueueItem).createdAt,
          retries: Math.max(0, Math.floor((row as SybnbSyncQueueItem).retries)),
          failed: (row as SybnbSyncQueueItem).failed === true,
          processing: (row as SybnbSyncQueueItem).processing === true,
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function readSybnbSyncQueue(): SybnbSyncQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(window.localStorage.getItem(SYBNB_SYNC_QUEUE_KEY));
  } catch {
    return [];
  }
}

export function writeSybnbSyncQueue(items: SybnbSyncQueueItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = items.slice(-SYBNB_SYNC_QUEUE_MAX);
    window.localStorage.setItem(SYBNB_SYNC_QUEUE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent("sybnb-sync-queue-changed"));
  } catch {
    /* quota / private mode */
  }
}

/** Clear stuck `processing` flags before a engine run (recovery after tab crash mid-request). */
export function clearSybnbSyncProcessingFlags(): void {
  const q = readSybnbSyncQueue();
  if (!q.some((x) => x.processing)) return;
  writeSybnbSyncQueue(q.map((x) => ({ ...x, processing: false })));
}

export function removeSybnbSyncItemById(id: string): void {
  const idTrim = id.trim();
  if (!idTrim) return;
  writeSybnbSyncQueue(readSybnbSyncQueue().filter((x) => x.id !== idTrim));
}

export function upsertSybnbSyncItem(item: SybnbSyncQueueItem): void {
  const cur = readSybnbSyncQueue().filter((x) => x.id !== item.id);
  cur.push(item);
  writeSybnbSyncQueue(cur);
}

/** Dedupe by id — same clientRequestId never queued twice. Drops oldest rows when over {@link SYBNB_SYNC_QUEUE_MAX}. */
export function enqueueSybnbSyncItem(item: Omit<SybnbSyncQueueItem, "createdAt" | "retries"> & Partial<Pick<SybnbSyncQueueItem, "createdAt" | "retries">>): string {
  const id = item.id.trim();
  if (!id) return "";
  const row: SybnbSyncQueueItem = {
    id,
    type: item.type,
    payload: item.payload,
    createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
    retries: typeof item.retries === "number" ? item.retries : 0,
    failed: item.failed === true,
    processing: item.processing === true,
  };
  let cur = readSybnbSyncQueue().filter((x) => x.id !== row.id);
  cur.push(row);
  while (cur.length > SYBNB_SYNC_QUEUE_MAX) {
    cur.shift();
  }
  writeSybnbSyncQueue(cur);
  return id;
}

export function pendingSybnbSyncCount(): number {
  return readSybnbSyncQueue().filter((x) => !x.failed).length;
}

export function failedSybnbSyncCount(): number {
  return readSybnbSyncQueue().filter((x) => x.failed === true).length;
}

/** Clears `failed` and resets retries so the sync engine can replay dead-letter rows. */
export function retryFailedSybnbSyncItems(): void {
  const q = readSybnbSyncQueue();
  writeSybnbSyncQueue(
    q.map((x) =>
      x.failed ?
        { ...x, failed: false, retries: 0, processing: false }
      : x,
    ),
  );
}

export function pendingMessagesForBooking(bookingId: string): SybnbSyncQueueItem[] {
  const b = bookingId.trim();
  if (!b) return [];
  return readSybnbSyncQueue().filter(
    (x) => !x.failed && x.type === "message" && String(x.payload.bookingId ?? "") === b,
  );
}
