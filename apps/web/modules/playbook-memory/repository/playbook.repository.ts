/**
 * Memory strategy playbooks (`MemoryPlaybook` in Prisma) — distinct from CRM `conversion_playbooks` / `Playbook`.
 * Naming follows the product spec; implementation maps 1:1 to `memoryPlaybook` client APIs.
 */
import type { MemoryDomain, MemoryPlaybook, MemoryPlaybookVersion, PlaybookStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function createPlaybook(data: Prisma.MemoryPlaybookCreateInput): Promise<MemoryPlaybook> {
  return prisma.memoryPlaybook.create({ data });
}

export async function createPlaybookVersion(
  data: Prisma.MemoryPlaybookVersionCreateInput,
): Promise<MemoryPlaybookVersion> {
  return prisma.memoryPlaybookVersion.create({ data });
}

export async function getPlaybookById(
  id: string,
): Promise<
  | (MemoryPlaybook & { versions: MemoryPlaybookVersion[]; currentVersion: MemoryPlaybookVersion | null })
  | null
> {
  return prisma.memoryPlaybook.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { version: "desc" }, take: 20 },
      currentVersion: true,
    },
  });
}

export async function listPlaybooks(args: { take: number; skip: number }): Promise<{ total: number; rows: MemoryPlaybook[] }> {
  const [total, rows] = await Promise.all([
    prisma.memoryPlaybook.count(),
    prisma.memoryPlaybook.findMany({
      take: args.take,
      skip: args.skip,
      orderBy: { updatedAt: "desc" },
      include: { currentVersion: true },
    }),
  ]);
  return { total, rows };
}

export async function findCandidatePlaybooks(
  domain?: MemoryDomain,
): Promise<(MemoryPlaybook & { currentVersion: MemoryPlaybookVersion | null })[]> {
  return prisma.memoryPlaybook.findMany({
    where: { status: "ACTIVE", ...(domain ? { domain } : {}) },
    include: { currentVersion: true },
  });
}

export async function setCurrentVersion(playbookId: string, versionId: string): Promise<MemoryPlaybook> {
  return prisma.memoryPlaybook.update({
    where: { id: playbookId },
    data: { currentVersionId: versionId },
  });
}

export async function updatePlaybookStats(
  id: string,
  data: Prisma.MemoryPlaybookUpdateInput,
): Promise<MemoryPlaybook> {
  return prisma.memoryPlaybook.update({ where: { id }, data });
}

export async function updatePlaybookStatus(id: string, status: PlaybookStatus): Promise<MemoryPlaybook> {
  return prisma.memoryPlaybook.update({ where: { id }, data: { status } });
}

export async function createLifecycleEvent(
  data: Prisma.MemoryPlaybookLifecycleEventCreateInput,
): Promise<void> {
  await prisma.memoryPlaybookLifecycleEvent.create({ data });
}
