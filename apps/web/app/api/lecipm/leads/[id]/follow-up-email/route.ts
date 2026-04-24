import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { sendEmail, getReplyToEmail } from "@/lib/email/resend";
import { getLegalEmailFooter } from "@/lib/email/notifications";
import {
  getEvaluationFollowUpEmail,
  type FollowUpTemplateId,
} from "@/lib/email/evaluation-follow-up-templates";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";

export const dynamic = "force-dynamic";

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

/** Broker/admin manually sends prepared follow-up #2 or #3 (not auto-dripped). */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN" && viewer?.role !== "BROKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const templateId = body.templateId as FollowUpTemplateId | undefined;
  if (templateId !== "evaluation_followup_2" && templateId !== "evaluation_followup_3") {
    return NextResponse.json({ error: "Invalid templateId" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(viewer.role, viewerId, lead)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!lead.contactUnlockedAt || !lead.email?.includes("@")) {
    return NextResponse.json({ error: "Lead email unavailable" }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://lecipm.com";
  const { subject, html } = getEvaluationFollowUpEmail(templateId, {
    recipientName: lead.name,
    baseUrl: base,
  });

  const replyTo = getReplyToEmail();
  const sent = await sendEmail({
    to: lead.email,
    subject,
    html: html + getLegalEmailFooter(),
    ...(replyTo ? { replyTo } : {}),
  });

  await appendLeadTimelineEvent(id, "email_sent", {
    templateId,
    subject,
    manual: true,
  });

  return NextResponse.json({ ok: true, sent });
}
