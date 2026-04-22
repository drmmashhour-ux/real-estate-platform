import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { getGuestId } from "@/lib/auth/session";
import { createMatchProfile, matchResidences } from "@/modules/senior-living/matching.service";

export const dynamic = "force-dynamic";

/** Refresh scores for an existing profile (bookmark / results page). */
export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profileId")?.trim() ?? "";
  if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });
  try {
    const out = await matchResidences(profileId);
    return NextResponse.json({ profileId, ...out });
  } catch (e) {
    logError("[api.senior.match.get]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** POST body: either { profileId } or full profile fields to create + match. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const sessionUserId = await getGuestId();
    let profileId = typeof body.profileId === "string" ? body.profileId.trim() : "";
    if (!profileId) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return NextResponse.json({ error: "name or profileId required" }, { status: 400 });
      const uid =
        typeof body.userId === "string" ? body.userId.trim()
        : sessionUserId ?? null;
      const created = await createMatchProfile({
        name,
        age: typeof body.age === "number" ? body.age : null,
        mobilityLevel: typeof body.mobilityLevel === "string" ? body.mobilityLevel : null,
        medicalNeeds: typeof body.medicalNeeds === "string" ? body.medicalNeeds : null,
        budget: typeof body.budget === "number" ? body.budget : null,
        preferredCity: typeof body.preferredCity === "string" ? body.preferredCity : null,
        userId: uid,
      });
      profileId = created.id;
    }

    const { matches, insights } = await matchResidences(profileId);
    return NextResponse.json({ profileId, matches, insights });
  } catch (e) {
    logError("[api.senior.match]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
