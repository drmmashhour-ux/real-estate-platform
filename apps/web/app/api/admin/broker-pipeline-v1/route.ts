import { NextResponse } from "next/server";
import { z } from "zod";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  addBrokerNote,
  buildBrokerPipelineSummary,
  createBrokerProspect,
  listBrokerPipeline,
  markBrokerPurchaseOnProspect,
  setDemoLeadPreviewShown,
  updateBrokerContactMeta,
  updateBrokerStage,
} from "@/modules/brokers/broker-pipeline.service";
import { getBrokerMonitoringSnapshot, recordBrokerScriptCopied } from "@/modules/brokers/broker-monitoring.service";
import { getBrokerDailyActions } from "@/modules/brokers/broker-daily-actions.service";
import { getBrokerOutreachScripts, getBrokerOutreachScriptList } from "@/modules/brokers/broker-outreach.service";
import { buildBrokerLeadPreview } from "@/modules/brokers/broker-lead-preview.service";

export const dynamic = "force-dynamic";

const PostZ = z.object({
  name: z.string().min(1).max(200),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  phone: z.string().max(80).optional(),
  agency: z.string().max(200).optional(),
  source: z.enum(["manual", "instagram", "linkedin", "referral"]).optional(),
  notes: z.array(z.string().max(5000)).max(50).optional(),
});

const PatchZ = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("stage"),
    id: z.string().uuid(),
    stage: z.enum(["new", "contacted", "replied", "demo", "converted", "lost"]),
  }),
  z.object({
    action: z.literal("note"),
    id: z.string().uuid(),
    note: z.string().min(1).max(20_000),
  }),
  z.object({
    action: z.literal("script_copy"),
    id: z.string().uuid(),
    scriptKind: z.enum(["first_message", "follow_up", "demo_pitch", "close"]),
  }),
  z.object({
    action: z.literal("demo_shown"),
    id: z.string().uuid(),
    shown: z.boolean(),
  }),
  z.object({
    action: z.literal("mark_purchase"),
    id: z.string().uuid(),
    firstPurchaseDate: z.string().min(1).max(40),
    totalSpent: z.number().nonnegative().optional(),
  }),
]);

function gate() {
  if (!engineFlags.brokerAcquisitionV1) {
    return NextResponse.json({ error: "Broker acquisition V1 is disabled" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const denied = gate();
  if (denied) return denied;
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const prospects = listBrokerPipeline();
  const summary = buildBrokerPipelineSummary();
  const dailyActions = getBrokerDailyActions({ prospects });
  const monitoring = getBrokerMonitoringSnapshot();
  const scripts = getBrokerOutreachScripts();
  const scriptList = getBrokerOutreachScriptList();
  const leadPreview = buildBrokerLeadPreview();

  return NextResponse.json({
    prospects,
    summary,
    dailyActions,
    monitoring,
    scripts,
    scriptList,
    leadPreview,
  });
}

export async function POST(req: Request) {
  const denied = gate();
  if (denied) return denied;
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const json = await req.json().catch(() => ({}));
  const parsed = PostZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, phone, agency, source, notes } = parsed.data;
  try {
    const row = createBrokerProspect({
      name,
      email: email && email !== "" ? email : undefined,
      phone: phone?.trim() || undefined,
      agency: agency?.trim() || undefined,
      source,
      notes: notes?.length ? notes : undefined,
    });
    return NextResponse.json({ prospect: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create prospect";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const denied = gate();
  if (denied) return denied;
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const json = await req.json().catch(() => ({}));
  const parsed = PatchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  if (data.action === "stage") {
    const row = updateBrokerStage(data.id, data.stage);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prospect: row });
  }

  if (data.action === "note") {
    const row = addBrokerNote(data.id, data.note);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prospect: row });
  }

  if (data.action === "script_copy") {
    recordBrokerScriptCopied({ kind: data.scriptKind });
    const row = updateBrokerContactMeta(data.id, {
      lastContactAt: new Date().toISOString(),
      lastMessageType: data.scriptKind,
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prospect: row });
  }

  if (data.action === "demo_shown") {
    const row = setDemoLeadPreviewShown(data.id, data.shown);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prospect: row });
  }

  const row = markBrokerPurchaseOnProspect(data.id, {
    firstPurchaseDate: data.firstPurchaseDate,
    totalSpent: data.totalSpent,
    moveToConverted: true,
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ prospect: row });
}
