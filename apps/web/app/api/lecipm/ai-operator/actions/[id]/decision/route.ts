import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { approveAction, rejectAction, saveEditedPayload } from "@/src/modules/ai-operator/infrastructure/aiOperatorRepository";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const decision = body?.decision as string;
  const notes = typeof body?.notes === "string" ? body.notes : undefined;
  const editedPayload = body?.editedPayload && typeof body.editedPayload === "object" ? body.editedPayload : null;

  if (decision === "approve") {
    const ok = await approveAction(id, userId);
    return NextResponse.json({ ok });
  }
  if (decision === "reject") {
    const ok = await rejectAction(id, userId, notes);
    return NextResponse.json({ ok });
  }
  if (decision === "edit") {
    if (!editedPayload) return NextResponse.json({ error: "editedPayload required" }, { status: 400 });
    const ok = await saveEditedPayload(id, userId, editedPayload as Record<string, unknown>);
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
}
