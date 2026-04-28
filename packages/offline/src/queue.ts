import { STORES, openOfflineDexie } from "./db-open";
import type { OfflineAction } from "./types";

const MAX_RETRY = 5;

export async function enqueueAction(
  namespace: string,
  input: Omit<OfflineAction, "retries" | "createdAt"> & { retries?: number },
): Promise<void> {
  const db = await openOfflineDexie(namespace);
  const tx = db.transaction(STORES.queue, "readwrite");
  const existing = (await tx.store.get(input.id)) as OfflineAction | undefined;
  const action: OfflineAction = {
    ...input,
    retries: existing?.retries ?? input.retries ?? 0,
    createdAt: existing?.createdAt ?? Date.now(),
  };
  await tx.store.put(action);
  await tx.done;
}

export async function dequeueAction(namespace: string, id: string): Promise<void> {
  const db = await openOfflineDexie(namespace);
  await db.delete(STORES.queue as never, id);
}

export async function listQueuedActions(namespace: string): Promise<OfflineAction[]> {
  const db = await openOfflineDexie(namespace);
  return db.getAll(STORES.queue as never) as Promise<OfflineAction[]>;
}

export interface ProcessResult {
  /** Action completed server-side → remove */
  handled: boolean;
  /** Retry later (429 / flaky network): stop draining this cycle */
  transient?: boolean;
}

/**
 * Executes actions in chronological order until one transient failure or exhaustion.
 */
export async function drainOfflineQueue(params: {
  namespace: string;
  executeOne: (a: OfflineAction) => Promise<ProcessResult>;
  onDropped?: (a: OfflineAction, reason: "max_retries") => void;
}): Promise<number> {
  const { namespace, executeOne, onDropped } = params;
  const db = await openOfflineDexie(namespace);
  let rows = await db.getAll(STORES.queue as never);
  rows = [...(rows as OfflineAction[])].sort((a, b) => a.createdAt - b.createdAt);
  let sent = 0;
  for (const action of rows) {
    if (action.retries >= MAX_RETRY) {
      onDropped?.(action, "max_retries");
      await db.delete(STORES.queue as never, action.id);
      continue;
    }
    const r = await executeOne(action);
    if (r.handled) {
      await db.delete(STORES.queue as never, action.id);
      sent += 1;
    } else if (r.transient) {
      await bumpRetry(namespace, action);
      break;
    } else {
      await db.delete(STORES.queue as never, action.id);
    }
  }
  return sent;
}

async function bumpRetry(namespace: string, action: OfflineAction): Promise<void> {
  const db = await openOfflineDexie(namespace);
  const tx = db.transaction(STORES.queue, "readwrite");
  const next = { ...action, retries: action.retries + 1 };
  await tx.store.put(next);
  await tx.done;
}
