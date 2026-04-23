import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { getServerMarketingAiStore, replaceServerMarketingAiStore } from "@/modules/marketing-ai/marketing-ai-server-store";

export const dynamic = "force-dynamic";

/** POST body `{ queueItemId, approve: boolean, note?: string }` — updates server-synced queue only. */
export async function POST(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      queueItemId?: string;
      approve?: boolean;
      note?: string;
    };
    if (!body.queueItemId || typeof body.approve !== "boolean") {
      return Response.json({ error: "invalid_payload" }, { status: 400 });
    }

    const store = getServerMarketingAiStore();
    const q = store.queue.find((x) => x.id === body.queueItemId);
    if (!q || q.status !== "PENDING_APPROVAL") {
      return Response.json({ error: "not_pending" }, { status: 400 });
    }

    if (body.approve) {
      q.status = "APPROVED";
      q.decidedAtIso = new Date().toISOString();
      q.decisionNote = body.note;
    } else {
      q.status = "REJECTED";
      q.decidedAtIso = new Date().toISOString();
      q.decisionNote = body.note;
    }

    store.approvalLogs.unshift({
      id: `log-${Date.now()}`,
      queueItemId: q.id,
      decision: body.approve ? "APPROVED" : "REJECTED",
      atIso: new Date().toISOString(),
      note: body.note,
    });

    replaceServerMarketingAiStore(store);
    return Response.json({ ok: true, item: q });
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
}
