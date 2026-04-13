import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  computeBrokerReplyLatenciesMs,
  summarizeResponseMs,
} from "@/lib/messages/broker-response-stats";
import { canViewThread, type ThreadViewer } from "@/lib/messages/permissions";

export async function getLecipmBrokerThreadDetail(threadId: string, viewer: ThreadViewer) {
  const thread = await prisma.lecipmBrokerListingThread.findUnique({
    where: { id: threadId },
    include: {
      listing: { select: { id: true, title: true, listingCode: true } },
      broker: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!thread || !canViewThread(thread, viewer)) return null;

  const counterpartyLabel =
    viewer.kind === "broker" || viewer.kind === "admin"
      ? thread.customer?.name ?? thread.guestName ?? "Guest"
      : thread.broker.name ?? "Broker";

  const showBrokerMetrics = viewer.kind === "broker" || viewer.kind === "admin";
  const latencies = showBrokerMetrics ? computeBrokerReplyLatenciesMs(thread.messages) : [];
  const responseStats = showBrokerMetrics ? summarizeResponseMs(latencies) : null;

  const leadRows = await prisma.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT id FROM lecipm_broker_crm_leads WHERE thread_id = ${threadId} LIMIT 1`
  );
  const crmLeadId = leadRows[0]?.id ?? null;

  return {
    thread: {
      id: thread.id,
      status: thread.status,
      source: thread.source,
      subject: thread.subject,
      lastMessageAt: thread.lastMessageAt.toISOString(),
      createdAt: thread.createdAt.toISOString(),
      listing: thread.listing
        ? { id: thread.listing.id, title: thread.listing.title, listingCode: thread.listing.listingCode }
        : null,
      broker: { id: thread.broker.id, name: thread.broker.name, email: thread.broker.email },
      customer: thread.customer
        ? { id: thread.customer.id, name: thread.customer.name, email: thread.customer.email }
        : null,
      guestName: thread.guestName,
      guestEmail:
        viewer.kind === "broker" || viewer.kind === "admin" ? thread.guestEmail : null,
    },
    counterpartyLabel,
    responseStats:
      responseStats && showBrokerMetrics
        ? {
            avgResponseMs: responseStats.avgMs,
            medianResponseMs: responseStats.medianMs,
            brokerReplySamples: responseStats.sampleCount,
          }
        : undefined,
    crmLeadId,
    messages: thread.messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderRole: m.senderRole,
      senderUserId: m.senderUserId,
      senderName: m.sender?.name ?? null,
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}
