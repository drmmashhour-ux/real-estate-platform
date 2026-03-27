import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { executeAction } from "@/src/modules/ai-operator/application/executeAction";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const result = await executeAction(id, userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error.includes("Approval") ? 409 : 400 });
  }
  return NextResponse.json({ ok: true, resultLog: result.resultLog });
}
