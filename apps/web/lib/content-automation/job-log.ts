import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function appendContentJobLog(args: {
  contentJobId: string;
  eventType: string;
  message: string;
  metadataJson?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.contentJobLog.create({
    data: {
      contentJobId: args.contentJobId,
      eventType: args.eventType,
      message: args.message,
      metadataJson: (args.metadataJson ?? {}) as Prisma.InputJsonValue,
    },
  });
}
