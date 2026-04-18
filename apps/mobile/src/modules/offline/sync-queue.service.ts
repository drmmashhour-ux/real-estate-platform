type Queued = { path: string; body?: string; method: string };

const queue: Queued[] = [];

export function enqueueOfflineSync(item: Queued) {
  queue.push(item);
}

export function drainOfflineSyncQueue(): Queued[] {
  const out = [...queue];
  queue.length = 0;
  return out;
}

export function syncQueueLength(): number {
  return queue.length;
}
