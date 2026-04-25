import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { recalculateAllVesting } from "@/src/modules/equity/grants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let asOf = new Date();
  try {
    const body = await req.json();
    const d = (body as { asOf?: string })?.asOf;
    if (d) {
      const parsed = new Date(d);
      if (!Number.isNaN(parsed.getTime())) asOf = parsed;
    }
  } catch {
    /* body optional */
  }

  try {
    const result = await recalculateAllVesting(asOf);
    return Response.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "recalc failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
