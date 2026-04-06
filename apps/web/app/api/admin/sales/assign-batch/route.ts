import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { assignUnassignedLeads } from "@/src/modules/sales/distribution";
import type { DistributionMode } from "@/src/modules/sales/constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown> = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = (await req.json()) as Record<string, unknown>;
    }
  } catch {
    /* empty body ok */
  }
  const limit = typeof body.limit === "number" ? Math.min(200, Math.max(1, body.limit)) : 25;
  const mode = (body.mode === "priority" ? "priority" : "round_robin") as DistributionMode;

  try {
    const results = await assignUnassignedLeads(limit, mode);
    return Response.json({ ok: true, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "batch failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
