import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { userCanMutateCapitalData } from "@/modules/capital/capital-access";
import { updateCovenantStatus } from "@/modules/capital/covenant-tracking.service";

export const dynamic = "force-dynamic";

const TAG = "[covenant]";

export async function PATCH(request: NextRequest, context: { params: Promise<{ dealId: string; covenantId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId, covenantId } = await context.params;
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
    await updateCovenantStatus({
      pipelineDealId: dealId,
      covenantId,
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
