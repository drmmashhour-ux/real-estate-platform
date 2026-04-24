import { NextResponse } from "next/server";
import type { DreamHomeProfile } from "@/modules/dream-home/types/dream-home.types";
import { buildDreamHomeProfile } from "@/modules/dream-home/services/dream-home-profile.service";
import { matchDreamHomeListings } from "@/modules/dream-home/services/dream-home-match.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isProfile(x: unknown): x is DreamHomeProfile {
  if (!x || typeof x !== "object") {
    return false;
  }
  const o = x as Record<string, unknown>;
  if (
    typeof o.householdProfile !== "string" ||
    !Array.isArray(o.propertyTraits) ||
    !Array.isArray(o.neighborhoodTraits) ||
    !Array.isArray(o.rationale)
  ) {
    return false;
  }
  if (o.searchFilters == null || typeof o.searchFilters !== "object" || Array.isArray(o.searchFilters)) {
    return false;
  }
  return true;
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
  let profile: DreamHomeProfile | null = isProfile(b.profile) ? b.profile : null;
  let source: "ai" | "deterministic" = b.source === "ai" || b.source === "deterministic" ? b.source : "deterministic";
  if (!profile) {
    const built = await buildDreamHomeProfile(body);
    profile = built.profile;
    source = built.source;
  }
  if (!profile) {
    return NextResponse.json({ ok: false, error: "profile_required" }, { status: 400 });
  }
  const result = await matchDreamHomeListings(profile, source);
  return NextResponse.json({ ok: true, ...result });
}
