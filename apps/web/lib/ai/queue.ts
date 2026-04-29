import "server-only";

export type QueueItemType = "listing" | "booking" | "user" | "dispute";

export async function getQueueItems(_filters: {
  status?: "pending" | "flagged" | "approved" | "rejected";
  type?: QueueItemType;
  limit: number;
  offset: number;
}) {
  return [];
}

export async function enqueueItem(type: QueueItemType, entityId: string) {
  return { id: "", type, entityId, status: "pending" as const };
}
