import { randomUUID } from "node:crypto";

export interface QueuedPosRequest {
  id: string;
  endpoint: string;
  body: unknown;
  queuedAt: Date;
}

export class OfflineQueue {
  private readonly queue: QueuedPosRequest[] = [];

  enqueue(endpoint: string, body: unknown): QueuedPosRequest {
    const request = Object.freeze({
      id: randomUUID(),
      endpoint,
      body,
      queuedAt: new Date(),
    });
    this.queue.push(request);
    return request;
  }

  drain(): readonly QueuedPosRequest[] {
    const items = [...this.queue];
    this.queue.length = 0;
    return Object.freeze(items);
  }

  list(): readonly QueuedPosRequest[] {
    return Object.freeze([...this.queue]);
  }
}
