import { getGuestId } from "@/lib/auth/session";
import { assertNoShowVisitAccess } from "@/lib/lecipm/noshow-access";
import { markCannotAttend } from "@/modules/no-show-prevention/no-show-confirmation.service";

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
  const r = await markCannotAttend({ visitId, reason: typeof body.reason === "string" ? body.reason : undefined });
  if (!r.ok) {
    return Response.json({ error: r.error }, { status: 400 });
  }
  return Response.json({ ok: true, kind: "lecipm_noshow_cannot_attend_v1" });
}
