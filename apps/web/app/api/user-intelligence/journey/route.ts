import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { getJourneyState, updateJourneyState } from "@/modules/user-intelligence/services/user-journey.service";
import type { UserJourneyUpdateInput } from "@/modules/user-intelligence/types/user-intelligence.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const u = await requireAuthenticatedUser(req);
    if (u instanceof NextResponse) {
      return u;
    }
    const j = await getJourneyState(u.id);
    if (!j.ok) {
      return NextResponse.json({ ok: false, error: j.error, journey: null }, { status: 200 });
    }
    return NextResponse.json({ ok: true, journey: j.data });
  } catch {
    return NextResponse.json({ ok: false, error: "journey_unavailable", journey: null }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireAuthenticatedUser(req);
    if (u instanceof NextResponse) {
      return u;
    }
    let body: Partial<UserJourneyUpdateInput> = {};
    try {
      body = (await req.json()) as Partial<UserJourneyUpdateInput>;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    const r = await updateJourneyState({ ...body, userId: u.id });
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error }, { status: 200 });
    }
    return NextResponse.json({ ok: true, journey: r.data });
  } catch {
    return NextResponse.json({ ok: false, error: "journey_unavailable" }, { status: 200 });
  }
}
