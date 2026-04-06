import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { isHiringStage } from "@/src/modules/hiring/constants";
import { updateStage } from "@/src/modules/hiring/pipeline";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const stage = (body as { stage?: string }).stage;
  if (!stage || !isHiringStage(stage)) {
    return Response.json({ error: "valid stage required" }, { status: 400 });
  }

  try {
    const row = await updateStage(id, stage);
    return Response.json(row);
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}
