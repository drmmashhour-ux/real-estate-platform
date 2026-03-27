import type { BnhubOtaSyncResultStatus, BnhubOtaSyncType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function appendOtaSyncLog(args: {
  connectionId: string;
  listingId?: string | null;
  syncType: BnhubOtaSyncType;
  status: BnhubOtaSyncResultStatus;
  message?: string | null;
  payload?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.bnhubOtaSyncLog.create({
    data: {
      connectionId: args.connectionId,
      listingId: args.listingId ?? undefined,
      syncType: args.syncType,
      status: args.status,
      message: args.message ?? undefined,
      payload: args.payload,
    },
  });
}
