import { NextResponse } from "next/server";
import { clearDreamHomeSession, getDreamHomeSession, setDreamHomeSession } from "@/modules/dream-home/services/dream-home-session.service";
import type { DreamHomeSessionState } from "@/modules/dream-home/types/dream-home.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isState(x: unknown): x is DreamHomeSessionState {
  if (!x || typeof x !== "object") {
    return false;
  }
  const o = x as Record<string, unknown>;
  return (
    typeof o.step === "number" &&
    o.step >= 0 &&
    o.questionnaire != null &&
    typeof o.questionnaire === "object" &&
    !Array.isArray(o.questionnaire)
  );
}

export async function GET() {
  const s = await getDreamHomeSession();
  return NextResponse.json({ ok: true, session: s });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  if (b.clear === true) {
    await clearDreamHomeSession();
    return NextResponse.json({ ok: true, session: null });
  }
  if (!isState(b)) {
    return NextResponse.json({ ok: false, error: "session_shape" }, { status: 400 });
  }
  await setDreamHomeSession(b);
  const s = await getDreamHomeSession();
  return NextResponse.json({ ok: true, session: s });
}
