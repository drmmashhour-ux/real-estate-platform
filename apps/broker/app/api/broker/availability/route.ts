import { NextRequest, NextResponse } from "next/server";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { getBrokerAvailabilityRows } from "@/lib/visits/get-availability";
import { replaceBrokerAvailability, type AvailabilityInputRow } from "@/lib/visits/set-availability";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rows = await getBrokerAvailabilityRows(auth.user.id);
  return NextResponse.json({ availability: rows });
}

export async function POST(request: NextRequest) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const raw = o.availability ?? o.rows;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "availability must be an array" }, { status: 400 });
  }

  const rows: AvailabilityInputRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    rows.push({
      dayOfWeek: typeof r.dayOfWeek === "number" ? r.dayOfWeek : parseInt(String(r.dayOfWeek), 10),
      startTime: String(r.startTime ?? ""),
      endTime: String(r.endTime ?? ""),
      isActive: r.isActive === undefined ? true : Boolean(r.isActive),
      timeZone: typeof r.timeZone === "string" ? r.timeZone : undefined,
    });
  }

  try {
    await replaceBrokerAvailability(auth.user.id, rows);
    const availability = await getBrokerAvailabilityRows(auth.user.id);
    return NextResponse.json({ ok: true, availability });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
