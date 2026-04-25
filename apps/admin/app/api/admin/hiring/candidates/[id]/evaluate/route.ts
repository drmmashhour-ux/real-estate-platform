import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { evaluateCandidate } from "@/src/modules/hiring/pipeline";

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
  const b = body as { communication?: number; speed?: number; clarity?: number; closing?: number };

  try {
    const row = await evaluateCandidate(id, {
      communication: Number(b.communication),
      speed: Number(b.speed),
      clarity: Number(b.clarity),
      closing: Number(b.closing),
    });
    return Response.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "evaluate failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
