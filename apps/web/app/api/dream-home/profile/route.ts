import { NextResponse } from "next/server";
import { buildDreamHomeProfile } from "@/modules/dream-home/services/dream-home-profile.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  try {
    const { profile, source } = await buildDreamHomeProfile(body);
    return NextResponse.json({ ok: true, profile, source });
  } catch (e) {
    console.error("[dream-home] profile failed", e);
    return NextResponse.json({ ok: false, error: "profile_failed" }, { status: 500 });
  }
}
