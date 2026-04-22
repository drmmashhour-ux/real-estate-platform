import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import type { GenerateVideoProjectInput } from "@/modules/video-engine/video-project.service";
import { generateVideoEngineProject } from "@/modules/video-engine/video-project.service";

export const dynamic = "force-dynamic";

function parseBody(body: Record<string, unknown>): GenerateVideoProjectInput | null {
  const templateKey = body.templateKey as string | undefined;
  const durationTargetSec =
    body.durationTargetSec === 15 || body.durationTargetSec === 30 || body.durationTargetSec === 45 ? body.durationTargetSec : undefined;
  const aspectRatio =
    body.aspectRatio === "9:16" || body.aspectRatio === "1:1" || body.aspectRatio === "16:9" ? body.aspectRatio : undefined;

  if (!templateKey) return null;

  switch (templateKey) {
    case "listing_spotlight": {
      const listingId = String(body.listingId ?? "").trim();
      if (!listingId) return null;
      return { templateKey, listingId, durationTargetSec, aspectRatio };
    }
    case "luxury_property_showcase": {
      const fsboListingId = String(body.fsboListingId ?? "").trim();
      if (!fsboListingId) return null;
      return { templateKey, fsboListingId, durationTargetSec, aspectRatio };
    }
    case "bnhub_stay_spotlight": {
      const stayId = String(body.stayId ?? "").trim();
      if (!stayId) return null;
      return { templateKey, stayId, durationTargetSec, aspectRatio };
    }
    case "investor_opportunity_brief": {
      const opportunityId = String(body.opportunityId ?? "").trim();
      if (!opportunityId) return null;
      return { templateKey, opportunityId, durationTargetSec, aspectRatio };
    }
    case "residence_services_highlight": {
      const residenceId = String(body.residenceId ?? "").trim();
      if (!residenceId) return null;
      return { templateKey, residenceId, durationTargetSec, aspectRatio };
    }
    case "deal_of_the_day":
      return { templateKey, durationTargetSec, aspectRatio };
    case "top_5_listings_area": {
      const city = String(body.city ?? "").trim();
      if (!city) return null;
      return { templateKey, city, durationTargetSec, aspectRatio };
    }
    default:
      return null;
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const input = parseBody(raw);
  if (!input) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  try {
    const result = await generateVideoEngineProject(input);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generate_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
