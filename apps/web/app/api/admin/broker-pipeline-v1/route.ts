import { NextResponse } from "next/server";
import { z } from "zod";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  addBrokerNote,
  buildBrokerPipelineSummary,
  createBrokerProspect,
  getBrokerPipelinePersistenceMeta,
  incrementBrokerAcquisitionMetrics,
  listBrokerPipeline,
  markBrokerPurchaseOnProspect,
  setDemoLeadPreviewShown,
  updateBrokerContactMeta,
  updateBrokerStage,
  updateBrokerTerritoryAndTags,
} from "@/modules/brokers/broker-pipeline.service";
import { getBrokerMonitoringSnapshot, recordBrokerScriptCopied } from "@/modules/brokers/broker-monitoring.service";
import { getBrokerDailyActions } from "@/modules/brokers/broker-daily-actions.service";
import { getBrokerOutreachScripts, getBrokerOutreachScriptList } from "@/modules/brokers/broker-outreach.service";
import { buildBrokerLeadPreview } from "@/modules/brokers/broker-lead-preview.service";
import { brokerAcquisitionMonetizationConfig } from "@/modules/brokers/broker-acquisition-monetization.config";
import { getTopPerformingBrokers } from "@/modules/brokers/broker-performance.service";
import { assignLeadFromCrmLeadId, listLeadAssignments } from "@/modules/brokers/broker-leads.service";
import { listBrokerFollowUpSuggestions } from "@/modules/brokers/broker-followup.service";
import { classifyBrokerPriority, scoreBrokerProspect } from "@/modules/brokers/broker-scoring.service";
import {
  buildBrokerPipelineAlerts,
  buildBrokerPipelineInsights,
} from "@/modules/brokers/broker-pipeline-insights.service";
import { getBrokerAcquisitionRevenueSnapshot } from "@/modules/brokers/broker-acquisition-revenue-snapshot.service";

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
    scriptKind: z.enum([
      "first_message",
      "follow_up",
      "demo_pitch",
      "close",
      "closing",
      "featured_upsell",
      "lead_unlock_pitch",
    ]),
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
  z.object({
    action: z.literal("operator_meta"),
    id: z.string().uuid(),
    territoryRegion: z.string().max(160).optional(),
    operatorTags: z.array(z.enum(["paying", "active", "high_value"])).max(8).optional(),
  }),
  z.object({
    action: z.literal("route_crm_lead"),
    leadId: z.string().min(1).max(80),
  }),
  z.object({
    action: z.literal("conversion_metric"),
    id: z.string().uuid(),
    closedDealsDelta: z.number().int().nonnegative().optional(),
    revenueCadDelta: z.number().nonnegative().optional(),
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
  const assignments = listLeadAssignments();
  const todayUtc = new Date().toISOString().slice(0, 10);
  const unlockedToday = assignments.filter((a) => a.unlocked && (a.unlockedAt?.slice(0, 10) ?? "") === todayUtc).length;
  const leadsWaitingUnlock = assignments.filter((a) => !a.unlocked).length;

  const dailyActions = getBrokerDailyActions({
    prospects,
    leadsWaitingUnlock,
    leadsUnlockedToday: unlockedToday,
  });
  const monitoring = getBrokerMonitoringSnapshot();
  const scripts = getBrokerOutreachScripts();
  const scriptList = getBrokerOutreachScriptList();
  const leadPreview = buildBrokerLeadPreview();
  const monetizationConfig = brokerAcquisitionMonetizationConfig;
  const topBrokers = getTopPerformingBrokers(10);
  const followUpSuggestions = listBrokerFollowUpSuggestions(prospects);
  const brokerScores = prospects.map((p) => ({
    id: p.id,
    score: scoreBrokerProspect(p),
  }));
  const priorityTargets = prospects
    .map((p) => {
      const score = scoreBrokerProspect(p);
      const bucket = classifyBrokerPriority(p, score);
      if (!bucket) return null;
      return { prospect: p, bucket, score };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => b.score - a.score)
    .slice(0, 16);

  const [insights, alertsPayload, revenueSnapshot] = await Promise.all([
    buildBrokerPipelineInsights(prospects),
    buildBrokerPipelineAlerts({
      prospects,
      leadAssignmentsUnlockedToday: unlockedToday,
      assignmentsTracked: assignments.length,
    }),
    getBrokerAcquisitionRevenueSnapshot().catch(() => null),
  ]);

  return NextResponse.json({
    prospects,
    summary,
    persistence: getBrokerPipelinePersistenceMeta(),
    dailyActions,
    monitoring,
    scripts,
    scriptList,
    leadPreview,
    monetizationConfig,
    topBrokers,
    leadAssignments: assignments,
    followUpSuggestions,
    brokerScores,
    priorityTargets,
    insights,
    alerts: alertsPayload.lines,
    revenueSnapshot,
    featuredViewUpliftPercent: monetizationConfig.featuredListingViewUpliftPercent,
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

  if (data.action === "operator_meta") {
    const row = updateBrokerTerritoryAndTags(data.id, {
      territoryRegion: data.territoryRegion,
      operatorTags: data.operatorTags,
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prospect: row });
  }

  if (data.action === "route_crm_lead") {
    const assignment = await assignLeadFromCrmLeadId(data.leadId);
    if (!assignment) return NextResponse.json({ error: "Lead not found or could not assign" }, { status: 404 });
    return NextResponse.json({ assignment });
  }

  if (data.action === "conversion_metric") {
    const closed = data.closedDealsDelta ?? 0;
    const rev = data.revenueCadDelta ?? 0;
    if (closed === 0 && rev === 0) {
      return NextResponse.json({ error: "Provide closedDealsDelta and/or revenueCadDelta" }, { status: 400 });
    }
    const row = incrementBrokerAcquisitionMetrics(data.id, {
      closedDealsCount: closed,
      revenueCad: rev,
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prospect: row });
  }

  if (data.action === "mark_purchase") {
    const row = markBrokerPurchaseOnProspect(data.id, {
      firstPurchaseDate: data.firstPurchaseDate,
      totalSpent: data.totalSpent,
      moveToConverted: true,
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ prospect: row });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
