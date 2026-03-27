import { NextRequest, NextResponse } from "next/server";
import { incrementDailyProgress, type DailyBumpField } from "@/lib/client-acquisition/daily-progress";
import { requireAcquisitionAdmin } from "@/lib/client-acquisition/auth";

export const dynamic = "force-dynamic";

const FIELDS = new Set<DailyBumpField>(["contacts", "leads", "callsBooked", "clientsClosed"]);

export async function POST(req: NextRequest) {
  const auth = await requireAcquisitionAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as { field?: string } | null;
  const field = body?.field as DailyBumpField | undefined;
  if (!field || !FIELDS.has(field)) {
    return NextResponse.json(
      { error: "field must be one of: contacts, leads, callsBooked, clientsClosed" },
      { status: 400 }
    );
  }

  await incrementDailyProgress(auth.userId, new Date(), field, 1);
  return NextResponse.json({ ok: true });
}
