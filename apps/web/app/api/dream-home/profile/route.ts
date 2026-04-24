import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/auth/api-session";
import { buildDreamHomeProfile } from "@/modules/dream-home/services/dream-home-profile.service";
import {
  mergeStoredPreferencesIntoIntake,
  recordDreamHomeQuestionnaire,
} from "@/modules/user-intelligence/integrations/dream-home-user-intelligence";
import { normalizeQuestionnaire } from "@/modules/dream-home/utils/dream-home-normalize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const userId = await getSessionUserIdFromRequest(req);
  const merged = userId ? await mergeStoredPreferencesIntoIntake(userId, body) : body;
  const { profile, source } = await buildDreamHomeProfile(merged);
  if (userId) {
    const q = normalizeQuestionnaire(merged);
    void recordDreamHomeQuestionnaire(userId, q, profile);
  }
  return NextResponse.json({ ok: true, profile, source, persisted: Boolean(userId) });
}
