import { getGuestId } from "@/lib/auth/session";
import { rescheduleLecipmVisit } from "@/modules/no-show-prevention/no-show-reschedule.service";
import type { LecipmVisitSourceTag } from "@/modules/booking-system/booking.types";

export const dynamic = "force-dynamic";

const SRC: LecipmVisitSourceTag[] = ["CENTRIS", "DIRECT", "AI_CLOSER", "MOBILE"];

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: visitId } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const start = typeof body.start === "string" ? new Date(body.start) : null;
  const end = typeof body.end === "string" ? new Date(body.end) : null;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return Response.json({ error: "start and end (ISO) required" }, { status: 400 });
  }
  if (body.userConfirmed !== true) {
    return Response.json({ error: "userConfirmed must be true" }, { status: 400 });
  }
  const source = SRC.includes(body.source) ? (body.source as LecipmVisitSourceTag) : "MOBILE";
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
  return Response.json({ ok: true, visitId: r.visitId, kind: "mobile_lecipm_reschedule_v1" });
}
