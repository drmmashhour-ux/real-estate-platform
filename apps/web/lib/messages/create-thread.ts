import type { LecipmBrokerThreadSource } from "@prisma/client";
import { createBrokerCrmLeadForNewThread, scheduleScoreNewLead } from "@/lib/broker-crm/create-lead-from-thread";
import { prisma } from "@/lib/db";
import { generateGuestThreadToken } from "@/lib/messages/guest-token";
import { notifyBrokerNewListingInquiry } from "@/lib/messages/notify";
import { resolveBrokerForListing } from "@/lib/messages/resolve-broker-for-listing";
import { isValidEmail, validateMessageBody } from "@/lib/messages/validators";

export type CreateThreadInput = {
  listingId?: string | null;
  brokerUserId?: string | null;
  source: LecipmBrokerThreadSource;
  subject?: string | null;
  body: unknown;
  /** Logged-in buyer */
  customerUserId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
};

export type CreateThreadResult =
  | {
      ok: true;
      threadId: string;
      guestToken?: string;
      leadId: string;
    }
  | { ok: false; error: string; status?: number };

export async function createLecipmBrokerThread(input: CreateThreadInput): Promise<CreateThreadResult> {
  const bodyVal = validateMessageBody(input.body);
  if (!bodyVal.ok) return { ok: false, error: bodyVal.error, status: 400 };

  let brokerUserId: string | null = null;
  const listingId: string | null = input.listingId?.trim() || null;

  if (input.source === "listing_contact") {
    if (!listingId) return { ok: false, error: "listingId is required for listing contact", status: 400 };
    brokerUserId = await resolveBrokerForListing(listingId, input.brokerUserId);
    if (!brokerUserId) return { ok: false, error: "Could not resolve broker for this listing", status: 400 };
  } else {
    const bid = input.brokerUserId?.trim();
    if (!bid) return { ok: false, error: "brokerUserId is required", status: 400 };
    const broker = await prisma.user.findUnique({ where: { id: bid }, select: { id: true } });
    if (!broker) return { ok: false, error: "Broker not found", status: 404 };
    brokerUserId = bid;
  }

  const customerUserId = input.customerUserId?.trim() || null;
  let guestName = input.guestName?.trim() || null;
  let guestEmail = input.guestEmail?.trim().toLowerCase() || null;

  if (customerUserId) {
    const u = await prisma.user.findUnique({
      where: { id: customerUserId },
      select: { name: true, email: true },
    });
    if (!u) return { ok: false, error: "Customer not found", status: 404 };
    guestName = null;
    guestEmail = null;
  } else {
    if (!guestName || guestName.length < 2) return { ok: false, error: "Name is required", status: 400 };
    if (!guestEmail || !isValidEmail(guestEmail)) return { ok: false, error: "Valid email is required", status: 400 };
  }

  const subject = input.subject?.trim()?.slice(0, 512) || null;

  let guestToken: string | undefined;
  let guestTokenHash: string | null = null;
  if (!customerUserId) {
    const tok = generateGuestThreadToken();
    guestToken = tok.raw;
    guestTokenHash = tok.hash;
  }

  const { thread, leadId } = await prisma.$transaction(async (tx) => {
    const t = await tx.lecipmBrokerListingThread.create({
      data: {
        listingId,
        brokerUserId,
        customerUserId,
        guestName,
        guestEmail,
        guestTokenHash,
        subject,
        source: input.source,
        status: "open",
        lastMessageAt: new Date(),
        participants: {
          create: [
            { userId: brokerUserId, role: "broker" },
            ...(customerUserId ? [{ userId: customerUserId, role: "customer" }] : []),
          ],
        },
      },
    });

    await tx.lecipmBrokerListingMessage.create({
      data: {
        threadId: t.id,
        senderUserId: customerUserId,
        senderRole: customerUserId ? "customer" : "guest",
        body: bodyVal.body,
        isRead: false,
      },
    });

    const lead = await createBrokerCrmLeadForNewThread(tx, {
      threadId: t.id,
      listingId,
      brokerUserId,
      customerUserId,
      guestName,
      guestEmail,
      threadSource: input.source,
    });

    return { thread: t, leadId: lead.id };
  });

  void notifyBrokerNewListingInquiry(thread);
  scheduleScoreNewLead(leadId, brokerUserId);

  return { ok: true, threadId: thread.id, guestToken, leadId };
}
