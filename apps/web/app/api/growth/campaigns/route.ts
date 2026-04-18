import { NextResponse } from "next/server";
import { z } from "zod";
import { createCampaign, listCampaigns } from "@/modules/campaigns";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { PlatformRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(160),
  landingPath: z.string().max(512).optional().nullable(),
  utmSource: z.string().max(128).optional().nullable(),
  utmMedium: z.string().max(64).optional().nullable(),
  utmCampaign: z.string().max(256).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
});

export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  const rows = await listCampaigns();
  return NextResponse.json({ campaigns: rows });
}

export async function POST(req: Request) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  if (auth.role !== PlatformRole.ADMIN && auth.role !== PlatformRole.ACCOUNTANT) {
    return NextResponse.json({ error: "Campaign creation is restricted" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  }

  const row = await createCampaign({
    name: parsed.data.name,
    landingPath: parsed.data.landingPath ?? undefined,
    utmSource: parsed.data.utmSource ?? undefined,
    utmMedium: parsed.data.utmMedium ?? undefined,
    utmCampaign: parsed.data.utmCampaign ?? undefined,
    notes: parsed.data.notes ?? undefined,
  });
  return NextResponse.json({ id: row.id, slug: row.slug });
}
