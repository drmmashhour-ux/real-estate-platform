/**
 * Persistent offline queue for SYBNB booking chat (localStorage).
 * Key `sybnb_message_queue` — max {@link SYBNB_MESSAGE_QUEUE_MAX} items globally.
 */

export const SYBNB_MESSAGE_QUEUE_KEY = "sybnb_message_queue";

export const SYBNB_MESSAGE_QUEUE_MAX = 50;

export type SybnbQueuedMessage = {
  id: string;
  bookingId: string;
  content: string;
  createdAt: string;
  /** `failed` after network/API failure; user can retry */
  status?: "pending" | "failed";
};

function safeParse(raw: string | null): SybnbQueuedMessage[] {
  if (raw == null || raw === "") return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const out: SybnbQueuedMessage[] = [];
    for (const row of v) {
      if (
        row &&
        typeof row === "object" &&
        typeof (row as SybnbQueuedMessage).id === "string" &&
        typeof (row as SybnbQueuedMessage).bookingId === "string" &&
        typeof (row as SybnbQueuedMessage).content === "string" &&
        typeof (row as SybnbQueuedMessage).createdAt === "string"
      ) {
        const status = (row as SybnbQueuedMessage).status;
        out.push({
          id: (row as SybnbQueuedMessage).id,
          bookingId: (row as SybnbQueuedMessage).bookingId,
          content: (row as SybnbQueuedMessage).content,
          createdAt: (row as SybnbQueuedMessage).createdAt,
          status: status === "failed" ? "failed" : "pending",
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function readSybnbMessageQueue(): SybnbQueuedMessage[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(window.localStorage.getItem(SYBNB_MESSAGE_QUEUE_KEY));
  } catch {
    return [];
  }
}

export function writeSybnbMessageQueue(items: SybnbQueuedMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = items.slice(-SYBNB_MESSAGE_QUEUE_MAX);
    window.localStorage.setItem(SYBNB_MESSAGE_QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // quota / private mode — drop silently
  }
}

/** Append one message; trims oldest entries past {@link SYBNB_MESSAGE_QUEUE_MAX}. */
export function enqueueSybnbMessage(item: SybnbQueuedMessage): void {
  const cur = readSybnbMessageQueue().filter((x) => x.id !== item.id);
  cur.push(item);
  writeSybnbMessageQueue(cur);
}

export function removeSybnbQueuedMessage(clientId: string): void {
  const id = clientId.trim();
  if (!id) return;
  writeSybnbMessageQueue(readSybnbMessageQueue().filter((x) => x.id !== id));
}

export function updateSybnbQueuedMessage(
  clientId: string,
  patch: Partial<Pick<SybnbQueuedMessage, "status" | "content">>,
): void {
  const id = clientId.trim();
  if (!id) return;
  const cur = readSybnbMessageQueue().map((x) => (x.id === id ? { ...x, ...patch } : x));
  writeSybnbMessageQueue(cur);
}
