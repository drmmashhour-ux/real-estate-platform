import { NextRequest } from "next/server";
import { postNow } from "@/src/services/socialScheduler";

export const dynamic = "force-dynamic";

/** POST /api/cron/social-phase2 — publish due scheduled social posts. */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const r = await postNow(15);
  return Response.json({ ok: true, ...r });
}
