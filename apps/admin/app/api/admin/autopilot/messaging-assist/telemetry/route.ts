import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { recordDraftCopied, recordDraftViewed } from "@/modules/growth/ai-autopilot-messaging-monitoring.service";

/**
 * Internal-only counters + logs for messaging assist (copy / expand). No outbound messaging.
 */
export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  let body: { leadId?: string; tone?: string; priority?: string | null; event?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { leadId, tone, priority, event } = body;
  if (!leadId || typeof leadId !== "string") {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  if (event === "copy") {
    recordDraftCopied(leadId, typeof tone === "string" ? tone : "professional", priority ?? null);
  } else if (event === "view") {
    recordDraftViewed();
  } else {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
