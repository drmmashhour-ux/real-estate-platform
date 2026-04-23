import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import type { SimulationPersonaId } from "@/modules/call-center/call-center.types";
import { scoreTrainingReply } from "@/modules/call-center/training-feedback.service";
import { getPersonaProfile } from "@/modules/call-center/training-simulation.service";
import type { CallStage } from "@/modules/call-assistant/call-assistant.types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: {
    userReply?: string;
    personaId?: SimulationPersonaId;
    stage?: CallStage;
    discoveryIndex?: number;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const reply = body.userReply?.trim();
  const personaId = body.personaId;
  const stage = body.stage ?? "opening";

  if (!reply || !personaId) {
    return NextResponse.json({ error: "reply_and_persona_required" }, { status: 400 });
  }

  try {
    const persona = getPersonaProfile(personaId);
    const feedback = scoreTrainingReply(reply, persona, {
      stage,
      discoveryIndex: typeof body.discoveryIndex === "number" ? body.discoveryIndex : undefined,
    });
    return NextResponse.json({ ok: true, feedback });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "feedback_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
