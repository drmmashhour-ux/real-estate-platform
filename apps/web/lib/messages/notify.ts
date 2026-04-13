import type { LecipmBrokerListingThread } from "@prisma/client";
import { prisma } from "@/lib/db";

function dashboardListingInboxUrl(threadId: string): string {
  return `/dashboard/messages?lecipmThread=${encodeURIComponent(threadId)}`;
}

function accountMessagesUrl(threadId: string): string {
  return `/account/messages?threadId=${encodeURIComponent(threadId)}`;
}

/**
 * Future: send transactional email when a new listing inquiry arrives.
 * @todo Connect `sendTransactionalEmail` + template `broker_new_listing_inquiry`.
 */
export async function queueEmailBrokerNewInquiry(_input: {
  brokerUserId: string;
  listingTitle: string;
  threadId: string;
}): Promise<void> {
  void _input;
}

/**
 * Future: email the buyer when the broker replies (logged-in customers).
 * @todo Connect `sendTransactionalEmail` + template `buyer_broker_replied`.
 */
export async function queueEmailCustomerBrokerReply(_input: {
  customerUserId: string;
  listingTitle: string;
  threadId: string;
}): Promise<void> {
  void _input;
}

/**
 * In-app notification when a buyer or guest messages the broker (new listing thread).
 */
export async function notifyBrokerNewListingInquiry(thread: LecipmBrokerListingThread): Promise<void> {
  const listing = thread.listingId
    ? await prisma.listing.findUnique({
        where: { id: thread.listingId },
        select: { title: true },
      })
    : null;
  const titleHint = listing?.title?.trim().slice(0, 80) ?? "New inquiry";
  await prisma.notification.create({
    data: {
      userId: thread.brokerUserId,
      type: "MESSAGE",
      title: "New listing inquiry",
      message: titleHint,
      priority: "NORMAL",
      actionUrl: dashboardListingInboxUrl(thread.id),
      actionLabel: "Open thread",
      listingId: thread.listingId ?? undefined,
      metadata: { channel: "lecipm_listing_thread", threadId: thread.id } as object,
    },
  });
  void queueEmailBrokerNewInquiry({
    brokerUserId: thread.brokerUserId,
    listingTitle: titleHint,
    threadId: thread.id,
  });
}

/**
 * In-app notification when the broker replies (logged-in buyer only).
 */
export async function notifyCustomerBrokerReplied(thread: LecipmBrokerListingThread): Promise<void> {
  const customerId = thread.customerUserId;
  if (!customerId) return;

  const listing = thread.listingId
    ? await prisma.listing.findUnique({
        where: { id: thread.listingId },
        select: { title: true },
      })
    : null;
  const titleHint = listing?.title?.trim().slice(0, 80) ?? "Your broker replied";

  await prisma.notification.create({
    data: {
      userId: customerId,
      type: "MESSAGE",
      title: "Reply from your broker",
      message: titleHint,
      priority: "NORMAL",
      actionUrl: accountMessagesUrl(thread.id),
      actionLabel: "View message",
      listingId: thread.listingId ?? undefined,
      metadata: { channel: "lecipm_listing_thread", threadId: thread.id } as object,
    },
  });
  void queueEmailCustomerBrokerReply({
    customerUserId: customerId,
    listingTitle: titleHint,
    threadId: thread.id,
  });
}
