/**
 * Shared HTTP handlers for investment pipeline deal APIs.
 * Used by `/api/deals/pipeline/[dealId]/…` and thin `/api/deals/[id]/…` aliases (same behavior).
 */

import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { applyPipelineStage } from "@/modules/deals/deal-pipeline.service";
import { submitToCommittee, recordCommitteeDecision } from "@/modules/deals/deal-committee.service";
import { createCondition } from "@/modules/deals/deal-conditions.service";
import { createDiligenceTask } from "@/modules/deals/deal-diligence.service";
import { createSingleFollowUp } from "@/modules/deals/deal-followup.service";
import { userCanMutatePipelineDeal } from "@/modules/deals/deal-access";
import type { PipelineStage } from "@/modules/deals/deal.types";
import type { ConditionCategory } from "@/modules/deals/deal.types";
import type { DiligenceCategory } from "@/modules/deals/deal.types";
import type { FollowUpType } from "@/modules/deals/deal.types";
import type { CommitteeDecisionPayload } from "@/modules/deals/deal-decision-log.service";

const TAG_STAGE = "[deal-stage]";
const TAG_COMMITTEE = "[deal-committee]";
const TAG_CONDITION = "[deal-condition]";
const TAG_DILIGENCE = "[deal-diligence]";
const TAG_FOLLOWUP = "[deal-followup]";

export async function investmentPipelineStagePost(request: NextRequest, dealId: string): Promise<NextResponse> {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!(await userCanMutatePipelineDeal(userId, dealId))) {
    logInfo(`${TAG_STAGE}`, { forbidden: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { toStage?: PipelineStage; reason?: string };
    if (!body.toStage) return NextResponse.json({ error: "toStage required" }, { status: 400 });

    await applyPipelineStage({
      dealId,
      toStage: body.toStage,
      actorUserId: userId,
      reason: body.reason ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stage update failed";
    logInfo(`${TAG_STAGE}`, { dealId, msg });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function investmentPipelineCommitteeSubmitPost(dealId: string): Promise<NextResponse> {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!(await userCanMutatePipelineDeal(userId, dealId))) {
    logInfo(`${TAG_COMMITTEE}`, { forbidden: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await submitToCommittee(dealId, userId);
    return NextResponse.json({ ok: true, submissionId: result.submissionId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Submit failed";
    logInfo(`${TAG_COMMITTEE}`, { dealId, msg });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function investmentPipelineCommitteeDecisionPost(
  request: NextRequest,
  dealId: string,
): Promise<NextResponse> {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  try {
    const body = (await request.json()) as {
      submissionId?: string | null;
      payload?: CommitteeDecisionPayload;
    };
    if (!body.payload?.recommendation || !body.payload?.rationale) {
      return NextResponse.json({ error: "payload.recommendation and payload.rationale required" }, { status: 400 });
    }

    await recordCommitteeDecision({
      dealId,
      submissionId: body.submissionId ?? null,
      actorUserId: userId,
      payload: body.payload,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Decision failed";
    logInfo(`${TAG_COMMITTEE}`, { dealId, msg });
    const status = msg === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function investmentPipelineConditionPost(request: NextRequest, dealId: string): Promise<NextResponse> {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!(await userCanMutatePipelineDeal(userId, dealId))) {
    logInfo(`${TAG_CONDITION}`, { forbidden: true });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string | null;
      category?: ConditionCategory;
      priority?: string | null;
      dueDate?: string | null;
      ownerUserId?: string | null;
    };
    if (!body.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
    if (!body.category) return NextResponse.json({ error: "category required" }, { status: 400 });

    const row = await createCondition({
      dealId,
      title: body.title,
      description: body.description ?? null,
      category: body.category,
      priority: body.priority ?? null,
      ownerUserId: body.ownerUserId ?? userId,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    });
    return NextResponse.json({ ok: true, conditionId: row.id });
  } catch (e) {
    logInfo(`${TAG_CONDITION}`, { msg: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Failed to create condition" }, { status: 500 });
  }
}

export async function investmentPipelineDiligencePost(request: NextRequest, dealId: string): Promise<NextResponse> {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!(await userCanMutatePipelineDeal(userId, dealId))) {
    logInfo(`${TAG_DILIGENCE}`, { forbidden: true });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string | null;
      category?: DiligenceCategory;
      priority?: string | null;
      dueDate?: string | null;
      linkedConditionId?: string | null;
    };
    if (!body.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
    if (!body.category) return NextResponse.json({ error: "category required" }, { status: 400 });

    const row = await createDiligenceTask({
      dealId,
      title: body.title,
      description: body.description ?? null,
      category: body.category,
      priority: body.priority ?? null,
      ownerUserId: userId,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      linkedConditionId: body.linkedConditionId ?? null,
    });
    return NextResponse.json({ ok: true, taskId: row.id });
  } catch (e) {
    logInfo(TAG_DILIGENCE, { msg: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function investmentPipelineFollowUpPost(request: NextRequest, dealId: string): Promise<NextResponse> {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!(await userCanMutatePipelineDeal(userId, dealId))) {
    logInfo(`${TAG_FOLLOWUP}`, { forbidden: true });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string | null;
      followUpType?: FollowUpType;
      dueDate?: string | null;
      ownerUserId?: string | null;
    };
    if (!body.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
    if (!body.followUpType) return NextResponse.json({ error: "followUpType required" }, { status: 400 });

    const row = await createSingleFollowUp({
      dealId,
      title: body.title,
      description: body.description ?? null,
      followUpType: body.followUpType,
      ownerUserId: body.ownerUserId ?? userId,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    });
    return NextResponse.json({ ok: true, followUpId: row.id });
  } catch (e) {
    logInfo(`${TAG_FOLLOWUP}`, { msg: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Failed to create follow-up" }, { status: 500 });
  }
}
