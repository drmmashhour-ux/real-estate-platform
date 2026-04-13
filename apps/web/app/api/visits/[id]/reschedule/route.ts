import { NextRequest, NextResponse } from "next/server";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { rescheduleVisitRequest } from "@/lib/visits/reschedule-visit";
import { parseISODate } from "@/lib/visits/validators";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Params) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newStart = parseISODate(body.newStart ?? body.requestedStart);
  if (!newStart) return NextResponse.json({ error: "newStart (ISO) required" }, { status: 400 });

  const durationMinutes = typeof body.durationMinutes === "number" ? body.durationMinutes : undefined;
  const brokerNote = typeof body.brokerNote === "string" ? body.brokerNote : undefined;

  try {
    await rescheduleVisitRequest({
      requestId: id,
      brokerUserId: auth.user.id,
      newStart,
      durationMinutes,
      brokerNote,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
