import { NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { getBrokerCrmLeadDetail } from "@/lib/broker-crm/get-lead";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const lead = await findLeadForBrokerScope(id, auth.user.id, auth.user.role);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const detail = await getBrokerCrmLeadDetail(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    lead: {
      id: detail.id,
      status: detail.status,
      source: detail.source,
      priorityLabel: detail.priorityLabel,
      priorityScore: detail.priorityScore,
      interestSummary: detail.interestSummary,
      nextFollowUpAt: detail.nextFollowUpAt?.toISOString() ?? null,
      lastContactAt: detail.lastContactAt?.toISOString() ?? null,
      guestName: detail.guestName,
      guestEmail: detail.guestEmail,
      customer: detail.customer,
      listing: detail.listing,
      threadId: detail.threadId,
      createdAt: detail.createdAt.toISOString(),
    },
    messages: detail.thread?.messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderRole: m.senderRole,
      senderName: m.sender?.name ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
    notes: detail.notes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
    })),
    tags: detail.tags.map((t) => ({ id: t.id, tag: t.tag })),
    latestInsight: detail.aiInsights[0]
      ? {
          summary: detail.aiInsights[0].summary,
          suggestedReply: detail.aiInsights[0].suggestedReply,
          nextBestAction: detail.aiInsights[0].nextBestAction,
          intentScore: detail.aiInsights[0].intentScore,
          urgencyScore: detail.aiInsights[0].urgencyScore,
          confidenceScore: detail.aiInsights[0].confidenceScore,
          updatedAt: detail.aiInsights[0].updatedAt.toISOString(),
        }
      : null,
  });
}
