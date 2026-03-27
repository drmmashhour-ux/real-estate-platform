import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { dismissRiskFlag, escalateRiskFlag, resolveRiskFlag } from "@/modules/bnhub-trust/services/riskFlagService";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getGuestId();
  if (!adminId || !(await isPlatformAdmin(adminId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  let action = "";
  try {
    const b = await req.json();
    action = typeof b.action === "string" ? b.action.trim() : "";
  } catch {
    /* empty */
  }
  if (action === "resolve") await resolveRiskFlag(id, adminId);
  else if (action === "dismiss") await dismissRiskFlag(id, adminId);
  else if (action === "escalate") await escalateRiskFlag(id, adminId);
  else return Response.json({ error: "action: resolve | dismiss | escalate" }, { status: 400 });
  return Response.json({ ok: true });
}
