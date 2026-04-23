import { updatePostStatus } from "./auto-posting-queue.service";

export async function approvePost(id: string, adminId: string) {
  return updatePostStatus(id, "APPROVED", "APPROVED");
}

export async function rejectPost(id: string, adminId: string) {
  return updatePostStatus(id, "DRAFT", "REJECTED");
}

export async function bulkApproveSafePosts(ids: string[], adminId: string) {
  for (const id of ids) {
    await approvePost(id, adminId);
  }
}
