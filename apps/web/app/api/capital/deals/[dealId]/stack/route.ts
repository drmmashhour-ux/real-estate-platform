import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import {
  userCanAccessCapitalModule,
  userCanMutateCapitalData,
  userCanSelectOfferAndFinalize,
} from "@/modules/capital/capital-access";
import { getCapitalStack, upsertCapitalStack } from "@/modules/capital/capital-stack.service";
import type { CapitalStrategyType } from "@/modules/capital/capital.types";

export const dynamic = "force-dynamic";

const TAG = "[capital-stack]";

export async function GET(_request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!(await userCanAccessCapitalModule(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stack = await getCapitalStack(dealId);
  return NextResponse.json({ stack });
}

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!(await userCanMutateCapitalData(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status : undefined;
  if (status === "FINALIZED" && !(await userCanSelectOfferAndFinalize(userId))) {
    logInfo(`${TAG}`, { denied: true, reason: "finalize stack", dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const strategyType =
      typeof body.strategyType === "string" ? (body.strategyType as CapitalStrategyType) : undefined;
    const overrides = {
      totalCapitalRequired:
        body.totalCapitalRequired != null ? Number(body.totalCapitalRequired) : undefined,
      seniorDebtTarget: body.seniorDebtTarget != null ? Number(body.seniorDebtTarget) : undefined,
      mezzanineTarget: body.mezzanineTarget != null ? Number(body.mezzanineTarget) : undefined,
      preferredEquityTarget:
        body.preferredEquityTarget != null ? Number(body.preferredEquityTarget) : undefined,
      commonEquityTarget: body.commonEquityTarget != null ? Number(body.commonEquityTarget) : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      status,
    };

    const row = await upsertCapitalStack({
      pipelineDealId: dealId,
      actorUserId: userId,
      strategyType,
      overrides,
      useEnginePreview: body.useEnginePreview !== false,
    });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stack update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
