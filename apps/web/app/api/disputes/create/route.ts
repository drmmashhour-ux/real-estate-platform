import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getDisputeActor } from "@/modules/dispute-room/dispute-api-auth";
import { createDisputeCase, parseDisputeCreateBody } from "@/modules/dispute-room/dispute-case.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const actor = await getDisputeActor(request);
  if (actor instanceof NextResponse) return actor;

  const body = await request.json().catch(() => null);
  const parsed = parseDisputeCreateBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await createDisputeCase({
    openedByUserId: actor.userId,
    role: actor.role,
    body: parsed.value,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ dispute: result.dispute });
}
