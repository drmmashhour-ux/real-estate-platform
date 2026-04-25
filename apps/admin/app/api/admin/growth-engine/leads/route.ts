import { NextRequest, NextResponse } from "next/server";
import {
  GrowthEngineBrokerRoute,
  GrowthEngineLeadRole,
  GrowthEngineLeadSource,
  GrowthEngineLeadStage,
  GrowthEngineLeadUrgency,
  GrowthEnginePermissionStatus,
} from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { listGrowthLeads, quickAddManualLead } from "@/lib/growth/lead-service";

export const dynamic = "force-dynamic";

const STAGES: GrowthEngineLeadStage[] = [
  "new",
  "contacted",
  "interested",
  "awaiting_assets",
  "converted",
  "lost",
];

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const follow = searchParams.get("needsFollowUp");
  const brokerRoute = searchParams.get("brokerRoute");
  const leadUrgency = searchParams.get("leadUrgency");

  const ROUTES: GrowthEngineBrokerRoute[] = ["unspecified", "real_estate", "mortgage", "both"];
  const URG: GrowthEngineLeadUrgency[] = ["unspecified", "hot", "mid", "long_term"];

  const leads = await listGrowthLeads({
    ...(stage && STAGES.includes(stage as GrowthEngineLeadStage)
      ? { stage: stage as GrowthEngineLeadStage }
      : {}),
    ...(follow === "1" ? { needsFollowUp: true } : {}),
    ...(brokerRoute && ROUTES.includes(brokerRoute as GrowthEngineBrokerRoute)
      ? { brokerRoute: brokerRoute as GrowthEngineBrokerRoute }
      : {}),
    ...(leadUrgency && URG.includes(leadUrgency as GrowthEngineLeadUrgency)
      ? { leadUrgency: leadUrgency as GrowthEngineLeadUrgency }
      : {}),
  });

  return NextResponse.json({ leads });
}

const createSchema = z.object({
  role: z.enum(["owner", "broker", "buyer", "host"]),
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(64).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  source: z.enum(["form", "csv", "manual", "referral"]),
  permissionStatus: z.enum(["unknown", "requested", "granted", "rejected", "granted_by_source"]),
  notes: z.string().max(8000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const id = await quickAddManualLead({
    role: d.role as GrowthEngineLeadRole,
    name: d.name,
    email: d.email ?? null,
    phone: d.phone ?? null,
    city: d.city ?? null,
    source: d.source as GrowthEngineLeadSource,
    permissionStatus: d.permissionStatus as GrowthEnginePermissionStatus,
    notes: d.notes ?? null,
  });

  return NextResponse.json({ ok: true, id: id.id });
}
