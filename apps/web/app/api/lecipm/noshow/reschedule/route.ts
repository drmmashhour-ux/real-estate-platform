import { getGuestId } from "@/lib/auth/session";
import { rescheduleLecipmVisit } from "@/modules/no-show-prevention/no-show-reschedule.service";
import type { LecipmVisitSourceTag } from "@/modules/booking-system/booking.types";

export const dynamic = "force-dynamic";

const SRC: LecipmVisitSourceTag[] = ["CENTRIS", "DIRECT", "AI_CLOSER", "MOBILE"];

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const visitId = typeof body.visitId === "string" ? body.visitId : "";
  const start = typeof body.start === "string" ? new Date(body.start) : null;
  const end = typeof body.end === "string" ? new Date(body.end) : null;
  if (!visitId || !start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return Response.json({ error: "visitId, start, end (ISO) required" }, { status: 400 });
  }
  if (body.userConfirmed !== true) {
    return Response.json({ error: "userConfirmed must be true" }, { status: 400 });
  }
  const source = SRC.includes(body.source) ? (body.source as LecipmVisitSourceTag) : "DIRECT";
  const r = await rescheduleLecipmVisit({
    visitId,
    start,
    end,
    userConfirmed: true,
    source,
    actorUserId: userId,
  });
  if (!r.ok) {
    return Response.json({ error: r.error, code: r.code }, { status: r.code === "not_found" ? 404 : r.code === "forbidden" ? 403 : 409 });
  }
  return Response.json({ ok: true, visitId: r.visitId, kind: "lecipm_noshow_reschedule_v1" });
}
