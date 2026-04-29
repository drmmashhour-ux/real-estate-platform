"use client";

/**
 * Sequential SYBNB sync engine — processes `sync-queue.ts` one item at a time,
 * strict HTTP/json success checks, idempotent headers + bodies, circuit breaker.
 */

import { getClientId } from "@/lib/sybnb/client-id";
import {
  clearSybnbSyncProcessingFlags,
  readSybnbSyncQueue,
  removeSybnbSyncItemById,
  upsertSybnbSyncItem,
  type SybnbSyncQueueItem,
} from "@/lib/sybnb/sync-queue";

export type SybnbSyncPhase = "idle" | "pending" | "syncing" | "synced" | "failed" | "paused";

const DELAY_MIN_MS = 300;
const DELAY_MAX_MS = 500;
/** Row marked `failed` after this many failed delivery attempts (incremented per failure). */
const MAX_RETRIES = 3;
const CIRCUIT_BREAKER_FAILURES = 5;
const PAUSE_MS = 60_000;

let running = false;
let consecutiveFailures = 0;
let pausedUntil = 0;

function jitterDelayMs(): number {
  return DELAY_MIN_MS + Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS + 1));
}

type SybnbSyncApiBody = {
  success?: boolean;
  duplicate?: boolean;
  error?: string;
  warning?: boolean;
};

function requestHeaders(itemId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Client-Request-Id": itemId,
  };
}

async function readJsonBody(res: Response): Promise<SybnbSyncApiBody> {
  try {
    return (await res.json()) as SybnbSyncApiBody;
  } catch {
    return {};
  }
}

/** Strict logical success: HTTP ok + no explicit `success: false`, unless duplicate replay. */
function isSybnbSyncLogicalSuccess(res: Response, data: SybnbSyncApiBody): boolean {
  if (data.duplicate === true && res.ok) {
    return true;
  }
  if (!res.ok) {
    return false;
  }
  if (data.warning === true) {
    return false;
  }
  if (data.success === false) {
    return false;
  }
  return true;
}

/** Terminal outcomes — drop queue row without counting as transport failure. */
function isSybnbSyncTerminalAuth(res: Response): boolean {
  return res.status === 401 || res.status === 403;
}

function isSybnbSyncTransient(res: Response): boolean {
  return res.status === 408 || res.status === 429 || res.status >= 500;
}

function normalizeClientVersion(raw: unknown): number {
  const n = Number(raw ?? 1);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export type ProcessOneCallbacks = {
  onBookingConflict?: () => void;
};

/**
 * Returns true if the queue item should be removed (success or handled terminal case).
 * Returns false if the request should be retried later.
 */
async function processOne(item: SybnbSyncQueueItem, callbacks?: ProcessOneCallbacks): Promise<boolean> {
  const rid = item.id;
  const deviceId = getClientId();

  if (item.type === "message") {
    const bookingId = String(item.payload.bookingId ?? "").trim();
    const content = String(item.payload.content ?? "");
    if (!bookingId || !content) return true;

    let res: Response;
    try {
      res = await fetch("/api/sybnb/messages", {
        method: "POST",
        credentials: "same-origin",
        headers: requestHeaders(rid),
        body: JSON.stringify({
          bookingId,
          content,
          clientRequestId: rid,
          clientId: deviceId,
        }),
      });
    } catch {
      return false;
    }

    const data = await readJsonBody(res);
    if (isSybnbSyncTerminalAuth(res)) return true;
    if (isSybnbSyncTransient(res)) return false;
    if (!isSybnbSyncLogicalSuccess(res, data)) return false;
    return true;
  }

  if (item.type === "booking_action") {
    const action = String(item.payload.action ?? "").trim();

    if (action === "booking_request") {
      const listingId = String(item.payload.listingId ?? "").trim();
      const checkIn = String(item.payload.checkIn ?? "").trim();
      const checkOut = String(item.payload.checkOut ?? "").trim();
      const guests = Number(item.payload.guests ?? 0);
      if (!listingId || !checkIn || !checkOut || !Number.isFinite(guests) || guests < 1) return true;

      let res: Response;
      try {
        res = await fetch("/api/sybnb/bookings", {
          method: "POST",
          credentials: "same-origin",
          headers: requestHeaders(rid),
          body: JSON.stringify({
            listingId,
            checkIn,
            checkOut,
            guests: Math.floor(guests),
            clientRequestId: rid,
            clientId: deviceId,
          }),
        });
      } catch {
        return false;
      }

      const data = await readJsonBody(res);
      if (isSybnbSyncTerminalAuth(res)) return true;
      if (isSybnbSyncTransient(res)) return false;
      if (!isSybnbSyncLogicalSuccess(res, data)) return false;
      return true;
    }

    const bookingId = String(item.payload.bookingId ?? "").trim();
    if (!bookingId || (action !== "approve" && action !== "decline")) return true;

    const cv = normalizeClientVersion(item.payload.clientVersion);

    let res: Response;
    try {
      res = await fetch(`/api/sybnb/bookings/${encodeURIComponent(bookingId)}/${action}`, {
        method: "POST",
        credentials: "same-origin",
        headers: requestHeaders(rid),
        body: JSON.stringify({
          clientRequestId: rid,
          clientVersion: cv,
          clientId: deviceId,
        }),
      });
    } catch {
      return false;
    }

    const data = await readJsonBody(res);
    if (isSybnbSyncTerminalAuth(res)) return true;
    if (data.error === "CONFLICT" || data.error === "SOFT_LOCK") {
      callbacks?.onBookingConflict?.();
      return true;
    }
    if (res.status === 409 && data.error === "bad_state") return true;
    if (isSybnbSyncTransient(res)) return false;
    if (!isSybnbSyncLogicalSuccess(res, data)) return false;
    return true;
  }

  return true;
}

export type RunSyncOptions = {
  onPhase?: (phase: SybnbSyncPhase) => void;
  onSynced?: () => void;
  onBookingConflict?: () => void;
};

/** Pause outbound sync (e.g. after circuit breaker). */
export function pauseSybnbSync(ms: number = PAUSE_MS): void {
  pausedUntil = Date.now() + ms;
}

export async function runSync(opts?: RunSyncOptions): Promise<{ processed: number; remaining: number }> {
  const onPhase = opts?.onPhase;
  const onSynced = opts?.onSynced;
  const onBookingConflict = opts?.onBookingConflict;

  if (running) {
    const remaining = readSybnbSyncQueue().filter((x) => !x.failed).length;
    return { processed: 0, remaining };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const remaining = readSybnbSyncQueue().filter((x) => !x.failed).length;
    onPhase?.(remaining > 0 ? "pending" : "idle");
    return { processed: 0, remaining };
  }

  if (Date.now() < pausedUntil) {
    onPhase?.("paused");
    return {
      processed: 0,
      remaining: readSybnbSyncQueue().filter((x) => !x.failed).length,
    };
  }

  clearSybnbSyncProcessingFlags();

  const queue = readSybnbSyncQueue().filter((x) => !x.failed);
  if (queue.length === 0) {
    onPhase?.("idle");
    consecutiveFailures = 0;
    return { processed: 0, remaining: 0 };
  }

  running = true;
  onPhase?.("syncing");
  let processed = 0;

  try {
    const sorted = [...queue].sort((a, b) => a.createdAt - b.createdAt);

    for (let i = 0; i < sorted.length; i += 1) {
      const item = sorted[i];
      if (typeof navigator !== "undefined" && !navigator.onLine) break;

      const fresh = readSybnbSyncQueue().find((x) => x.id === item.id);
      if (!fresh || fresh.failed) continue;

      if (fresh.retries >= MAX_RETRIES) {
        upsertSybnbSyncItem({ ...fresh, failed: true, processing: false });
        continue;
      }

      upsertSybnbSyncItem({ ...fresh, processing: true });

      let ok = false;
      try {
        ok = await processOne(fresh, { onBookingConflict });
      } catch {
        ok = false;
      }

      const latest = readSybnbSyncQueue().find((x) => x.id === item.id);
      if (!latest) continue;

      upsertSybnbSyncItem({ ...latest, processing: false });

      if (ok) {
        removeSybnbSyncItemById(item.id);
        processed += 1;
        consecutiveFailures = 0;
      } else {
        consecutiveFailures += 1;
        const nextRetries = latest.retries + 1;
        const failed = nextRetries >= MAX_RETRIES;
        upsertSybnbSyncItem({
          ...latest,
          retries: nextRetries,
          failed,
          processing: false,
        });

        if (consecutiveFailures >= CIRCUIT_BREAKER_FAILURES) {
          pauseSybnbSync(PAUSE_MS);
          consecutiveFailures = 0;
          onPhase?.("paused");
          break;
        }
      }

      if (i < sorted.length - 1) {
        await new Promise((r) => setTimeout(r, jitterDelayMs()));
      }
    }

    const remaining = readSybnbSyncQueue().filter((x) => !x.failed).length;
    const anyFailed = readSybnbSyncQueue().some((x) => x.failed);

    if (processed > 0) {
      onPhase?.("synced");
      onSynced?.();
      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          onPhase?.(remaining > 0 ? "pending" : "idle");
        }, 1200);
      }
    } else {
      const pausedNow = Date.now() < pausedUntil;
      if (pausedNow) {
        onPhase?.("paused");
      } else if (anyFailed) {
        onPhase?.("failed");
      } else {
        onPhase?.(remaining > 0 ? "pending" : "idle");
      }
    }

    return { processed, remaining };
  } finally {
    running = false;
  }
}

export function syncCircuitPausedUntil(): number {
  return pausedUntil;
}
