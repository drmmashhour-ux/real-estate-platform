import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "sales_call_started",
  "sales_whatsapp_sent",
  "sales_email_sent",
  "sales_meeting_scheduled",
  "sales_deal_closed",
]);

function canAccess(
  role: string | undefined,
  viewerId: string,
  lead: { introducedByBrokerId: string | null; lastFollowUpByBrokerId: string | null; leadSource: string | null }
): boolean {
  if (role === "ADMIN") return true;
  if (role !== "BROKER") return false;
  const shared =
    lead.leadSource === "evaluation_lead" || lead.leadSource === "broker_consultation";
  return (
    lead.introducedByBrokerId === viewerId ||
    lead.lastFollowUpByBrokerId === viewerId ||
    shared
  );
}

/** Log broker sales-assistant actions to the lead timeline (conversion tracking). */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true, name: true, email: true },
  });
  if (viewer?.role !== "ADMIN" && viewer?.role !== "BROKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(viewer.role, viewerId, lead)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const payload = typeof body.payload === "object" && body.payload !== null ? body.payload : {};

  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  await appendLeadTimelineEvent(id, type, {
    ...payload,
    brokerId: viewerId,
    brokerLabel: viewer.name ?? viewer.email,
  });

  return NextResponse.json({ ok: true });
}
