import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { userCanAccessCapitalModule, userCanMutateCapitalData } from "@/modules/capital/capital-access";
import { addPipelineLender, listPipelineLenders } from "@/modules/capital/lender-workflow.service";

export const dynamic = "force-dynamic";

const TAG = "[lender-workflow]";

export async function GET(_request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!(await userCanAccessCapitalModule(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lenders = await listPipelineLenders(dealId);
  return NextResponse.json({ lenders });
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  try {
    const row = await addPipelineLender({
      pipelineDealId: dealId,
      actorUserId: userId,
      name,
      lenderType: typeof body.lenderType === "string" ? body.lenderType : null,
      contactName: typeof body.contactName === "string" ? body.contactName : null,
      contactEmail: typeof body.contactEmail === "string" ? body.contactEmail : null,
      notes: typeof body.notes === "string" ? body.notes : null,
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
