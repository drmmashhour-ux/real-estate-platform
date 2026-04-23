import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { evaluateLiveTurn } from "@/modules/live-training/live-feedback.engine";
import type { LivePersonaType } from "@/modules/live-training/live-training.types";

export const dynamic = "force-dynamic";

/** Lightweight feedback for mobile / drill — instant scoring only (no outbound voice). */
export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = (await req.json()) as {
      userMessage?: string;
      personaType?: LivePersonaType;
      tension?: number;
    };
    const msg = body.userMessage?.trim();
    const personaType = body.personaType ?? "driver_broker";
    const tension = typeof body.tension === "number" ? body.tension : 35;

    if (!msg) return NextResponse.json({ error: "message_required" }, { status: 400 });

    const feedback = evaluateLiveTurn(msg, personaType, tension);
    return NextResponse.json({ ok: true, feedback });
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
}
