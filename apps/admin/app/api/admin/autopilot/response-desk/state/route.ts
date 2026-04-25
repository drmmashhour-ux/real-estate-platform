import { NextResponse } from "next/server";
import { aiResponseDeskFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  markDraftDone,
  markDraftNeedsReview,
  markDraftReviewed,
} from "@/modules/growth/ai-response-desk-state.service";
import {
  recordResponseDeskDone,
  recordResponseDeskNeedsReview,
  recordResponseDeskReviewed,
} from "@/modules/growth/ai-response-desk-monitoring.service";

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  if (!aiResponseDeskFlags.aiResponseDeskV1 || !aiResponseDeskFlags.aiResponseDeskReviewStateV1) {
    return NextResponse.json({ error: "Response desk review state disabled" }, { status: 403 });
  }

  let body: { leadId?: string; action?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leadId = body.leadId;
  if (!leadId || typeof leadId !== "string") {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  const action = body.action;
  let result: { ok: boolean; reason?: string };

  if (action === "reviewed") {
    result = await markDraftReviewed(leadId);
    if (result.ok) recordResponseDeskReviewed();
  } else if (action === "needs_review") {
    result = await markDraftNeedsReview(leadId);
    if (result.ok) recordResponseDeskNeedsReview();
  } else if (action === "done") {
    result = await markDraftDone(leadId);
    if (result.ok) recordResponseDeskDone();
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? "update_failed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
