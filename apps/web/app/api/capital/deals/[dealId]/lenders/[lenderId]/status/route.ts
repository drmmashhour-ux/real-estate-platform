import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { userCanMutateCapitalData } from "@/modules/capital/capital-access";
import { updateLenderStatus } from "@/modules/capital/lender-workflow.service";

export const dynamic = "force-dynamic";

const TAG = "[lender-workflow]";

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string; lenderId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId, lenderId } = await context.params;
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

  const status = typeof body.status === "string" ? body.status : "";
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

  try {
    await updateLenderStatus({
      pipelineDealId: dealId,
      lenderId,
      actorUserId: userId,
      status,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
