import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  buildCampaignTrackedUrl,
  createCampaign,
  listCampaigns,
} from "@/modules/campaigns/campaign.service";

export const dynamic = "force-dynamic";

/** GET /api/campaigns — list marketing campaigns (admin). */
export async function GET() {
  const s = await requireAdminSession();
  if (!s.ok) return NextResponse.json({ error: s.error }, { status: s.status });
  const rows = await listCampaigns();
  const campaigns = rows.map((c) => ({
    ...c,
    trackedUrlFrCa: (() => {
      try {
        return buildCampaignTrackedUrl(c);
      } catch {
        return null as string | null;
      }
    })(),
  }));
  return NextResponse.json({ campaigns });
}

/** POST /api/campaigns — create campaign (admin). */
export async function POST(req: NextRequest) {
  const s = await requireAdminSession();
  if (!s.ok) return NextResponse.json({ error: s.error }, { status: s.status });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  try {
    const row = await createCampaign({
      name,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      landingPath: typeof body.landingPath === "string" ? body.landingPath : null,
      utmSource: typeof body.utmSource === "string" ? body.utmSource : null,
      utmMedium: typeof body.utmMedium === "string" ? body.utmMedium : null,
      utmCampaign: typeof body.utmCampaign === "string" ? body.utmCampaign : null,
      utmTerm: typeof body.utmTerm === "string" ? body.utmTerm : null,
      utmContent: typeof body.utmContent === "string" ? body.utmContent : null,
      notes: typeof body.notes === "string" ? body.notes : null,
    });
    return NextResponse.json({ campaign: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
