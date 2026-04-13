import { ContentMachineScheduleStatus, ContentMachinePieceStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { contentMachineDailyBudget, contentMachineSlotHoursUtc } from "@/lib/content-machine/env";

function nextUtcDayBase(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/**
 * Schedule specific content IDs (e.g. just generated) or backlog when `contentIds` omitted.
 */
export async function scheduleDailySlots(opts?: {
  limit?: number;
  day?: Date;
  /** When set, only these rows are scheduled (must be video_ready). */
  contentIds?: string[];
}): Promise<{ created: number }> {
  const day = opts?.day ? nextUtcDayBase(opts.day) : nextUtcDayBase(new Date());
  const limit = opts?.limit ?? contentMachineDailyBudget();
  const hours = contentMachineSlotHoursUtc();

  const slotTimes: Date[] = [];
  for (let i = 0; i < limit; i++) {
    const h = hours[i % hours.length]!;
    const t = new Date(day);
    t.setUTCHours(h, 0, 0, 0);
    if (t.getTime() < Date.now() - 60_000) {
      t.setUTCDate(t.getUTCDate() + 1);
    }
    slotTimes.push(t);
  }

  const candidates = await prisma.machineGeneratedContent.findMany({
    where: {
      status: ContentMachinePieceStatus.video_created,
      videoUrl: { not: null },
      schedules: {
        none: {
          status: { in: [ContentMachineScheduleStatus.pending, ContentMachineScheduleStatus.confirmed] },
        },
      },
      ...(opts?.contentIds?.length ? { id: { in: opts.contentIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true },
  });

  let created = 0;
  const platforms: Array<"TIKTOK" | "INSTAGRAM"> = ["TIKTOK", "INSTAGRAM"];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]!;
    const when = slotTimes[i] ?? slotTimes[slotTimes.length - 1]!;
    for (const platform of platforms) {
      await prisma.contentMachineSchedule.create({
        data: {
          contentId: c.id,
          platform,
          scheduledAt: when,
          status: ContentMachineScheduleStatus.pending,
        },
      });
      created++;
    }
    await prisma.machineGeneratedContent.update({
      where: { id: c.id },
      data: { status: ContentMachinePieceStatus.scheduled },
    });
  }

  return { created };
}

export async function listSchedulesForContent(contentId: string) {
  return prisma.contentMachineSchedule.findMany({
    where: { contentId },
    orderBy: { scheduledAt: "asc" },
  });
}

/**
 * Clear pending/confirmed slots and create the next daily slot pair (TikTok + Instagram) for this piece.
 */
export async function rescheduleMachineContent(contentId: string): Promise<{ created: number }> {
  await prisma.contentMachineSchedule.deleteMany({
    where: {
      contentId,
      status: { in: [ContentMachineScheduleStatus.pending, ContentMachineScheduleStatus.confirmed] },
    },
  });
  await prisma.machineGeneratedContent.updateMany({
    where: { id: contentId, videoUrl: { not: null } },
    data: { status: ContentMachinePieceStatus.video_created },
  });
  return scheduleDailySlots({ contentIds: [contentId], limit: 1 });
}
