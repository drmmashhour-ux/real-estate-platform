import { NextResponse } from "next/server";
import type { DreamHomeMatchedListing, DreamHomeProfile } from "@/modules/dream-home/types/dream-home.types";
import { buildDreamHomeProfile } from "@/modules/dream-home/services/dream-home-profile.service";
import { rankDreamHomeListings } from "@/modules/dream-home/services/dream-home-ranking.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isProfile(x: unknown): x is DreamHomeProfile {
  if (!x || typeof x !== "object") {
    return false;
  }
  const o = x as Record<string, unknown>;
  if (typeof o.householdProfile !== "string" || !Array.isArray(o.propertyTraits) || !Array.isArray(o.rationale)) {
    return false;
  }
  if (o.searchFilters == null || typeof o.searchFilters !== "object" || Array.isArray(o.searchFilters)) {
    return false;
  }
  return true;
}

function isListing(x: unknown): x is DreamHomeMatchedListing {
  if (!x || typeof x !== "object") {
    return false;
  }
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.matchScore === "number" &&
    Array.isArray(o.whyThisFits)
  );
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
  const listings = Array.isArray(b.listings) ? b.listings : [];
  if (!listings.length || !listings.every((x) => isListing(x))) {
    return NextResponse.json({ ok: false, error: "listings_required" }, { status: 400 });
  }
  const playbookBoostPlaybookId = typeof b.playbookBoostPlaybookId === "string" ? b.playbookBoostPlaybookId : null;

  let profile: DreamHomeProfile | null = isProfile(b.profile) ? b.profile : null;
  if (!profile) {
    const built = await buildDreamHomeProfile(body);
    profile = built.profile;
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: "profile_required" }, { status: 400 });
  }

  const { ranked, playbooksConsidered, warnings } = await rankDreamHomeListings(profile, listings as DreamHomeMatchedListing[], {
    playbookBoostPlaybookId: playbookBoostPlaybookId ?? undefined,
  });
  return NextResponse.json({ ok: true, profile, ranked, playbooksConsidered, warnings });
}
