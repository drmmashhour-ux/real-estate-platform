import Link from "next/link";
import { listGrowthLeads } from "@/lib/growth/lead-service";
import { getGrowthEngineDashboardMetrics } from "@/lib/growth/metrics";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  GrowthPipelineClient,
  type SerializedGrowthLead,
} from "@/components/admin/growth-engine/GrowthPipelineClient";

export const dynamic = "force-dynamic";

export default async function GrowthPipelinePage() {
  const [leads, metrics] = await Promise.all([
    listGrowthLeads({}),
    getGrowthEngineDashboardMetrics(prisma),
  ]);

  const initialLeads = JSON.parse(JSON.stringify(leads)) as SerializedGrowthLead[];

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">Growth CRM</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Pipeline</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Inbound leads, CSV imports, and manual adds. Outreach is copy / mailto only — no auto-external sends.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/growth" className="text-emerald-400 hover:text-emerald-300">
          ← Growth home
        </Link>
        <Link href="/admin/listing-acquisition" className="text-sky-400 hover:text-sky-300">
          Listing acquisition →
        </Link>
      </div>
      <div className="mt-10">
        <GrowthPipelineClient initialLeads={initialLeads} metrics={metrics} />
      </div>
    </main>
  );
}
