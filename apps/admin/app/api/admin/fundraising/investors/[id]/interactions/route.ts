import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { logInteraction } from "@/src/modules/fundraising/pipeline";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
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
  const b = body as { type?: string; summary?: string };
  const type = typeof b.type === "string" ? b.type.trim() : "";
  const summary = typeof b.summary === "string" ? b.summary : "";
  if (!type) return Response.json({ error: "type required" }, { status: 400 });

  try {
    const row = await logInteraction(id, type, summary);
    return Response.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "log failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
