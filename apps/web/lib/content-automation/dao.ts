import {
  ContentAutomationJobStatus,
  ContentAutomationPlatformTarget,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listContentJobs(args: {
  take?: number;
  listingId?: string;
  status?: ContentAutomationJobStatus;
  platformTarget?: ContentAutomationPlatformTarget;
  skip?: number;
}) {
  const where: Prisma.ContentJobWhereInput = {};
  if (args.listingId) where.listingId = args.listingId;
  if (
    args.status &&
    (Object.values(ContentAutomationJobStatus) as string[]).includes(args.status)
  ) {
    where.status = args.status;
  }
  if (
    args.platformTarget &&
    (Object.values(ContentAutomationPlatformTarget) as string[]).includes(args.platformTarget)
  ) {
    where.platformTarget = args.platformTarget;
  }

  return prisma.contentJob.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: args.take ?? 50,
    skip: args.skip ?? 0,
    include: {
      shortTermListing: {
        select: {
          id: true,
          title: true,
          city: true,
          listingCode: true,
          listingStatus: true,
        },
      },
      _count: { select: { assets: true, socialPosts: true } },
    },
  });
}

export async function getContentJobDetail(jobId: string) {
  return prisma.contentJob.findUnique({
    where: { id: jobId },
    include: {
      shortTermListing: {
        include: {
          listingPhotos: { orderBy: { sortOrder: "asc" }, take: 12 },
        },
      },
      assets: { orderBy: { createdAt: "asc" } },
      socialPosts: {
        orderBy: { createdAt: "desc" },
        include: {
          performanceSnapshots: { orderBy: { pulledAt: "desc" }, take: 30 },
        },
      },
      logs: { orderBy: { createdAt: "desc" }, take: 80 },
    },
  });
}
