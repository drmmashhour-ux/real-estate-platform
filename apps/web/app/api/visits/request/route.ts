import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createVisitRequest } from "@/lib/visits/create-visit-request";
import { parseISODate } from "@/lib/visits/validators";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  const leadId = typeof body.leadId === "string" ? body.leadId : undefined;
  const threadId = typeof body.threadId === "string" ? body.threadId : undefined;
  const requestedStart = parseISODate(body.requestedStart);
  const durationMinutes = typeof body.durationMinutes === "number" ? body.durationMinutes : undefined;

  if (!listingId.trim() || !requestedStart) {
    return NextResponse.json({ error: "listingId and requestedStart (ISO) required" }, { status: 400 });
  }
  if (!leadId && !threadId) {
    return NextResponse.json({ error: "leadId or threadId required" }, { status: 400 });
  }

  try {
    const { id } = await createVisitRequest({
      listingId,
      leadId: leadId ?? null,
      threadId: threadId ?? null,
      requestedStart,
      customerUserId: userId,
      durationMinutes,
    });
    return NextResponse.json({ ok: true, visitRequestId: id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
