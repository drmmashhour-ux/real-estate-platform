import type {
  MemoryDomain,
  MemoryPlaybook,
  MemoryPlaybookVersion,
  PlaybookMemoryRecord,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";

export async function findMemoryRecordByIdempotencyKey(key: string): Promise<PlaybookMemoryRecord | null> {
  return prisma.playbookMemoryRecord.findUnique({ where: { idempotencyKey: key } });
}

export async function createMemoryRecord(data: Prisma.PlaybookMemoryRecordCreateInput): Promise<PlaybookMemoryRecord> {
  return prisma.playbookMemoryRecord.create({ data });
}

export async function updateMemoryRecord(
  id: string,
  data: Prisma.PlaybookMemoryRecordUpdateInput,
): Promise<PlaybookMemoryRecord> {
  return prisma.playbookMemoryRecord.update({ where: { id }, data });
}

export async function findMemoryRecordById(id: string): Promise<PlaybookMemoryRecord | null> {
  return prisma.playbookMemoryRecord.findUnique({ where: { id } });
}

export async function findSimilarMemories(params: {
  fingerprint?: string | null;
  segmentKey?: string | null;
  marketKey?: string | null;
  domain: Prisma.EnumMemoryDomainFilter;
  take: number;
}): Promise<PlaybookMemoryRecord[]> {
  const or: Prisma.PlaybookMemoryRecordWhereInput[] = [];
  if (params.fingerprint) {
    or.push({ similarityFingerprint: params.fingerprint });
  }
  if (params.segmentKey && params.marketKey) {
    or.push({ segmentKey: params.segmentKey, marketKey: params.marketKey });
  }
  return prisma.playbookMemoryRecord.findMany({
    where: {
      domain: params.domain,
      ...(or.length ? { OR: or } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: params.take,
  });
}

export async function listActiveMemoryPlaybooks(domain?: Prisma.EnumMemoryDomainFilter): Promise<MemoryPlaybook[]> {
  return prisma.memoryPlaybook.findMany({
    where: {
      status: "ACTIVE",
      ...(domain ? { domain } : {}),
    },
    include: {
      currentVersion: true,
    },
  }) as Promise<(MemoryPlaybook & { currentVersion: MemoryPlaybookVersion | null })[]>;
}

export async function getMemoryPlaybookById(id: string): Promise<
  | (MemoryPlaybook & {
      versions: MemoryPlaybookVersion[];
      currentVersion: MemoryPlaybookVersion | null;
    })
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

export async function createMemoryPlaybook(data: Prisma.MemoryPlaybookCreateInput): Promise<MemoryPlaybook> {
  return prisma.memoryPlaybook.create({ data });
}

export async function createMemoryPlaybookVersion(
  data: Prisma.MemoryPlaybookVersionCreateInput,
): Promise<MemoryPlaybookVersion> {
  return prisma.memoryPlaybookVersion.create({ data });
}

export async function updateMemoryPlaybook(
  id: string,
  data: Prisma.MemoryPlaybookUpdateInput,
): Promise<MemoryPlaybook> {
  return prisma.memoryPlaybook.update({ where: { id }, data });
}

export async function updateMemoryPlaybookVersion(
  id: string,
  data: Prisma.MemoryPlaybookVersionUpdateInput,
): Promise<MemoryPlaybookVersion> {
  return prisma.memoryPlaybookVersion.update({ where: { id }, data });
}

export async function memoriesForPlaybookAggregate(playbookId: string): Promise<PlaybookMemoryRecord[]> {
  return prisma.playbookMemoryRecord.findMany({
    where: { memoryPlaybookId: playbookId },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
}

export async function pendingOutcomeRecords(params: {
  olderThan: Date;
  take: number;
}): Promise<PlaybookMemoryRecord[]> {
  return prisma.playbookMemoryRecord.findMany({
    where: {
      outcomeStatus: "PENDING",
      createdAt: { lte: params.olderThan },
    },
    take: params.take,
    orderBy: { createdAt: "asc" },
  });
}

export async function appendOutcomeMetric(data: Prisma.MemoryPlaybookOutcomeMetricCreateInput): Promise<void> {
  await prisma.memoryPlaybookOutcomeMetric.create({ data });
}

export async function createLifecycleEvent(data: Prisma.MemoryPlaybookLifecycleEventCreateInput): Promise<void> {
  await prisma.memoryPlaybookLifecycleEvent.create({ data });
}

export async function createRetrievalIndex(data: Prisma.MemoryPlaybookRetrievalIndexCreateInput): Promise<void> {
  await prisma.memoryPlaybookRetrievalIndex.create({ data });
}

export async function countMemoryPlaybooks(where: Prisma.MemoryPlaybookWhereInput): Promise<number> {
  return prisma.memoryPlaybook.count({ where });
}

export async function findRecentMemoryRecords(take: number): Promise<PlaybookMemoryRecord[]> {
  return prisma.playbookMemoryRecord.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}
