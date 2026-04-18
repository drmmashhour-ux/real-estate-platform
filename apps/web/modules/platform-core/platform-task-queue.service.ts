import type { CoreSystemSource, CoreTaskStatus } from "./platform-core.types";
import { createTask, listTasks, updateTaskStatus, type CreateTaskInput } from "./platform-core.repository";

export async function enqueuePlatformTask(input: CreateTaskInput) {
  return createTask(input);
}

export async function dequeuePendingTasks(limit = 25) {
  return listTasks({ status: "QUEUED", limit });
}

export async function markTaskRunning(id: string) {
  return updateTaskStatus(id, "RUNNING", { incrementAttempt: true });
}

export async function markTaskSucceeded(id: string, metadata?: Record<string, unknown>) {
  return updateTaskStatus(id, "SUCCEEDED", { metadata });
}

export async function markTaskFailed(id: string, error: string) {
  return updateTaskStatus(id, "FAILED", { lastError: error });
}

export async function cancelTask(id: string) {
  return updateTaskStatus(id, "CANCELLED", {});
}

export async function listTasksBySource(source: CoreSystemSource, status?: CoreTaskStatus, limit = 50) {
  return listTasks({ source, status, limit });
}
