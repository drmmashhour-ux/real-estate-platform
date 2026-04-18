import { prisma } from "@/lib/db";

export async function createReconciliationRecord(input: {
  officeId: string;
  recordType: import("@prisma/client").OfficeReconciliationRecordType;
  sourceType: string;
  sourceId: string;
  actorUserId?: string | null;
}) {
  return prisma.officeReconciliationRecord.create({
    data: {
      officeId: input.officeId,
      recordType: input.recordType,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      createdByUserId: input.actorUserId ?? undefined,
    },
  });
}
