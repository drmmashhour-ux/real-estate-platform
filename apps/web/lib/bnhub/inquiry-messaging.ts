import { prisma } from "@/lib/db";
import { nextRollingAverageMs } from "@/lib/messaging/response-time";

async function notifyInquiryRecipient(params: {
  threadId: string;
  recipientId: string;
  listingTitle: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.recipientId,
        type: "MESSAGE",
        title: "New BNHUB message",
        message: params.listingTitle.slice(0, 120),
        priority: "NORMAL",
        actionUrl: `/messages?threadId=${encodeURIComponent(params.threadId)}`,
        actionLabel: "Open thread",
        metadata: { channel: "bnhub_inquiry", threadId: params.threadId } as object,
      },
    });
  } catch (e) {
    console.error("[bnhub inquiry] in-app notify failed", e);
  }
}

export async function getOrCreateBnhubInquiryThread(params: {
  shortTermListingId: string;
  guestUserId: string;
}) {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: params.shortTermListingId },
    select: { id: true, ownerId: true },
  });
  if (!listing) return { error: "listing_not_found" as const };
  if (listing.ownerId === params.guestUserId) {
    return { error: "cannot_message_own_listing" as const };
  }

  const existing = await prisma.bnhubInquiryThread.findFirst({
    where: {
      shortTermListingId: params.shortTermListingId,
      guestUserId: params.guestUserId,
    },
  });
  if (existing) return { thread: existing };

  const thread = await prisma.bnhubInquiryThread.create({
    data: {
      shortTermListingId: params.shortTermListingId,
      guestUserId: params.guestUserId,
      hostUserId: listing.ownerId,
    },
  });
  return { thread };
}

export async function appendBnhubInquiryMessage(params: {
  threadId: string;
  senderId: string;
  body: string;
}) {
  const thread = await prisma.bnhubInquiryThread.findUnique({
    where: { id: params.threadId },
    select: {
      id: true,
      guestUserId: true,
      hostUserId: true,
      hostAvgResponseMs: true,
      hostResponseSamples: true,
      listing: { select: { title: true } },
    },
  });
  if (!thread) return { error: "thread_not_found" as const };
  if (params.senderId !== thread.guestUserId && params.senderId !== thread.hostUserId) {
    return { error: "forbidden" as const };
  }

  const prev = await prisma.bnhubInquiryMessage.findFirst({
    where: { threadId: params.threadId },
    orderBy: { createdAt: "desc" },
    select: { senderId: true, createdAt: true },
  });

  const msg = await prisma.bnhubInquiryMessage.create({
    data: {
      threadId: params.threadId,
      senderId: params.senderId,
      body: params.body,
    },
    include: { sender: { select: { id: true, name: true, email: true } } },
  });

  let hostAvgResponseMs = thread.hostAvgResponseMs;
  let hostResponseSamples = thread.hostResponseSamples;
  if (
    params.senderId === thread.hostUserId &&
    prev &&
    prev.senderId === thread.guestUserId
  ) {
    const delta = msg.createdAt.getTime() - prev.createdAt.getTime();
    if (delta >= 0 && delta < 1000 * 60 * 60 * 48) {
      const { avg, count } = nextRollingAverageMs(
        thread.hostAvgResponseMs,
        thread.hostResponseSamples,
        delta
      );
      hostAvgResponseMs = avg;
      hostResponseSamples = count;
    }
  }

  await prisma.bnhubInquiryThread.update({
    where: { id: params.threadId },
    data: {
      lastMessageAt: msg.createdAt,
      hostAvgResponseMs,
      hostResponseSamples,
    },
  });

  const recipientId =
    params.senderId === thread.guestUserId ? thread.hostUserId : thread.guestUserId;
  const listingTitle = thread.listing?.title?.trim() || "Stay inquiry";
  void notifyInquiryRecipient({
    threadId: params.threadId,
    recipientId,
    listingTitle,
  });

  return { message: msg };
}
