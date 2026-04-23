import { getGuestId } from "@/lib/auth/session";
import { assertNoShowVisitAccess } from "@/lib/lecipm/noshow-access";
import { reconfirmVisit } from "@/modules/no-show-prevention/no-show-confirmation.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const visitId = typeof body.visitId === "string" ? body.visitId : "";
  if (!visitId) {
    return Response.json({ error: "visitId required" }, { status: 400 });
  }
  const gate = await assertNoShowVisitAccess({ userId, visitId });
  if (!gate.ok) {
    return Response.json({ error: gate.error }, { status: gate.status });
  }
  const m = body.method === "in_app" || body.method === "email_one_click" || body.method === "api" ? body.method : "api";
  const r = await reconfirmVisit({ visitId, method: m });
  if (!r.ok) {
    return Response.json({ error: r.error }, { status: 400 });
  }
  return Response.json({ ok: true, kind: "lecipm_noshow_confirm_v1" });
}
