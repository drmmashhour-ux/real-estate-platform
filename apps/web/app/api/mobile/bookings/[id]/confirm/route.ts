import { getGuestId } from "@/lib/auth/session";
import { assertNoShowVisitAccess } from "@/lib/lecipm/noshow-access";
import { reconfirmVisit } from "@/modules/no-show-prevention/no-show-confirmation.service";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: visitId } = await ctx.params;
  const gate = await assertNoShowVisitAccess({ userId, visitId });
  if (!gate.ok) {
    return Response.json({ error: gate.error }, { status: gate.status });
  }
  const r = await reconfirmVisit({ visitId, method: "in_app" });
  if (!r.ok) {
    return Response.json({ error: r.error }, { status: 400 });
  }
  return Response.json({ ok: true, kind: "mobile_lecipm_confirm_v1" });
}
