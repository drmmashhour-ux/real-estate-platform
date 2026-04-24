import { getGuestId } from "@/lib/auth/session";
import { assertNoShowVisitAccess } from "@/lib/lecipm/noshow-access";
import { markCannotAttend } from "@/modules/no-show-prevention/no-show-confirmation.service";
import { recordOutcome } from "@/modules/outcomes/outcome.service";

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
  void recordOutcome({
    entityType: "booking",
    entityId: visitId,
    actionTaken: "visit_noshow",
    predictedOutcome: { pAttend: 0.86 },
    actualOutcome: { noshow: true, reason: typeof body.reason === "string" ? body.reason : undefined },
    source: "system",
    contextUserId: userId,
  }).then((res) => {
    if (!res.ok) console.error("[lecipm][outcome] noshow record failed", res);
  });
  return Response.json({ ok: true, kind: "lecipm_noshow_cannot_attend_v1" });
}
