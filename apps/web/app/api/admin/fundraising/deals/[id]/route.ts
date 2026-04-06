import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { isFundraisingDealStatus } from "@/src/modules/fundraising/constants";
import { updateDealStatus } from "@/src/modules/fundraising/pipeline";

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
  const status = (body as { status?: string })?.status;
  if (!status || !isFundraisingDealStatus(status)) {
    return Response.json({ error: "valid status required" }, { status: 400 });
  }

  try {
    const row = await updateDealStatus(id, status);
    return Response.json(row);
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}
