import { NextResponse } from "next/server";
import { aiResponseDeskFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  recordResponseDeskCopy,
  recordResponseDeskDraftsQueued,
  recordResponseDeskPanelView,
} from "@/modules/growth/ai-response-desk-monitoring.service";

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  if (!aiResponseDeskFlags.aiResponseDeskV1) {
    return NextResponse.json({ error: "Response desk disabled" }, { status: 403 });
  }

  let body: { leadId?: string; event?: string; queuedCount?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, leadId, queuedCount } = body;
  if (event === "panel_view") {
    recordResponseDeskPanelView();
    if (typeof queuedCount === "number" && Number.isFinite(queuedCount) && queuedCount >= 0) {
      recordResponseDeskDraftsQueued(queuedCount);
    }
  } else if (event === "copy") {
    if (!leadId || typeof leadId !== "string") {
      return NextResponse.json({ error: "leadId required" }, { status: 400 });
    }
    recordResponseDeskCopy(leadId);
  } else {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
