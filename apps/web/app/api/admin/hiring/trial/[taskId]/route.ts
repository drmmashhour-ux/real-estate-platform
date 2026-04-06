import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { submitTrialTaskResult } from "@/src/modules/hiring/pipeline";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ taskId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { taskId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as { resultSummary?: string; responseQuality?: number | null };

  try {
    const row = await submitTrialTaskResult(
      taskId,
      b.resultSummary ?? "",
      b.responseQuality
    );
    return Response.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "update failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
