import { prisma } from "@/lib/db";

import { schedulePost } from "./marketing-scheduler.service";

export async function approveMarketingPost(postId: string, scheduledAt: Date): Promise<{ ok: boolean; reason?: string }> {
  const r = await schedulePost(postId, scheduledAt, { skipDailyCap: true });
  return r.ok ? { ok: true } : r;
}

export async function updateMarketingCaption(postId: string, caption: string): Promise<void> {
  await prisma.lecipmMarketingHubPost.update({
    where: { id: postId },
    data: { captionEdited: caption.slice(0, 12000) },
  });
}

export async function cancelMarketingPost(postId: string): Promise<void> {
  await prisma.lecipmMarketingHubPost.update({
    where: { id: postId },
    data: { status: "cancelled", scheduledAt: null },
  });
}
