import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { userCanAccessCapitalModule, userCanMutateCapitalData } from "@/modules/capital/capital-access";
import { createCovenant, listCovenants } from "@/modules/capital/covenant-tracking.service";

export const dynamic = "force-dynamic";

const TAG = "[covenant]";

export async function GET(_request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!(await userCanAccessCapitalModule(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const covenants = await listCovenants(dealId);
  return NextResponse.json({ covenants });
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

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const covenantType = typeof body.covenantType === "string" ? body.covenantType.trim() : "";
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  if (!title || !covenantType || !summary) {
    return NextResponse.json({ error: "title, covenantType, summary required" }, { status: 400 });
  }

  try {
    const row = await createCovenant({
      pipelineDealId: dealId,
      actorUserId: userId,
      title,
      summary,
      covenantType,
      offerId: typeof body.offerId === "string" ? body.offerId : null,
      frequency: typeof body.frequency === "string" ? body.frequency : null,
      status: typeof body.status === "string" ? body.status : undefined,
      notes: typeof body.notes === "string" ? body.notes : null,
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
