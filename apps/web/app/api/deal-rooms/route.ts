import { Prisma } from "@prisma/client";
import { prisma } from "@repo/db";
import { createDealRoom } from "@/lib/deals/create-deal-room";
import { createDealRoomFromLead } from "@/lib/deals/create-from-lead";
import { createDealRoomFromThread } from "@/lib/deals/create-from-thread";
import { createDealRoomFromVisitRequest } from "@/lib/deals/create-from-visit";
import { listDealRooms } from "@/lib/deals/list-deal-rooms";
import { requireBrokerLikeApi } from "@/lib/forms/require-broker";
import {
  parsePriority,
  parseStage,
} from "@/lib/deals/validators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const url = new URL(req.url);
  const stage = parseStage(url.searchParams.get("stage"));
  const priorityLabel = parsePriority(url.searchParams.get("priority"));
  const listingId = url.searchParams.get("listingId") ?? undefined;
  const brokerUserId = url.searchParams.get("brokerUserId") ?? undefined;
  const followUpDue = url.searchParams.get("followUpDue") === "1";

  const scope =
    auth.role === "ADMIN"
      ? ({ mode: "admin" as const } as const)
      : ({ mode: "broker" as const, brokerUserId: auth.userId } as const);

  const rooms = await listDealRooms(scope, {
    stage: stage ?? undefined,
    priorityLabel: priorityLabel ?? undefined,
    listingId,
    brokerUserId: auth.role === "ADMIN" ? brokerUserId : undefined,
    followUpDueWithinHours: followUpDue ? 72 : undefined,
  });

  let adminStats: Record<string, unknown> | undefined;
  if (auth.role === "ADMIN" && url.searchParams.get("stats") === "1") {
    const [byStage, stuck, docPending, payPending] = await Promise.all([
      prisma.dealRoom.groupBy({
        by: ["stage"],
        _count: { id: true },
        where: { isArchived: false },
      }),
      prisma.dealRoom.count({
        where: {
          isArchived: false,
          updatedAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          stage: { notIn: ["closed", "lost"] },
        },
      }),
      prisma.dealRoomDocument.count({
        where: { status: { in: ["requested", "review_required"] } },
      }),
      prisma.dealRoomPayment.count({
        where: { status: "pending" },
      }),
    ]);
    adminStats = {
      byStage,
      stuckDeals: stuck,
      documentsAwaiting: docPending,
      paymentsPending: payPending,
      activeDealRooms: await prisma.dealRoom.count({ where: { isArchived: false } }),
    };
  }

  return Response.json({ rooms, adminStats });
}

export async function POST(req: Request) {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const source = typeof body.source === "string" ? body.source : "manual";

  try {
    if (source === "lead") {
      const leadId = typeof body.leadId === "string" ? body.leadId : null;
      if (!leadId) {
        return Response.json({ error: "leadId required" }, { status: 400 });
      }
      try {
        const room = await createDealRoomFromLead({
          leadId,
          brokerUserId: auth.userId,
          actorUserId: auth.userId,
        });
        return Response.json({ dealRoom: room });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          const existing = await prisma.dealRoom.findFirst({ where: { leadId } });
          if (existing) {
            return Response.json({ dealRoom: existing, deduped: true });
          }
        }
        throw e;
      }
    }
    if (source === "thread") {
      const threadId = typeof body.threadId === "string" ? body.threadId : null;
      const threadSource = body.threadSource === "crm" ? "crm" : "platform";
      if (!threadId) {
        return Response.json({ error: "threadId required" }, { status: 400 });
      }
      const room = await createDealRoomFromThread({
        threadId,
        threadSource,
        brokerUserId: auth.userId,
        actorUserId: auth.userId,
      });
      return Response.json({ dealRoom: room });
    }
    if (source === "visit") {
      const visitRequestId =
        typeof body.visitRequestId === "string" ? body.visitRequestId : null;
      if (!visitRequestId) {
        return Response.json({ error: "visitRequestId required" }, { status: 400 });
      }
      const room = await createDealRoomFromVisitRequest({
        visitRequestId,
        brokerUserId: auth.userId,
        actorUserId: auth.userId,
      });
      return Response.json({ dealRoom: room });
    }

    const room = await createDealRoom({
      brokerUserId: auth.userId,
      listingId: typeof body.listingId === "string" ? body.listingId : undefined,
      leadId: typeof body.leadId === "string" ? body.leadId : undefined,
      threadId: typeof body.threadId === "string" ? body.threadId : undefined,
      customerUserId: typeof body.customerUserId === "string" ? body.customerUserId : undefined,
      guestName: typeof body.guestName === "string" ? body.guestName : undefined,
      guestEmail: typeof body.guestEmail === "string" ? body.guestEmail : undefined,
      summary: typeof body.summary === "string" ? body.summary : undefined,
      actorUserId: auth.userId,
    });
    return Response.json({ dealRoom: room });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
