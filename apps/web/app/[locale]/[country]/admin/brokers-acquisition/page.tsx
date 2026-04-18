import Link from "next/link";
import { redirect } from "next/navigation";
import { engineFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { BrokerPipelineDashboard } from "@/components/brokers/BrokerPipelineDashboard";
import { getBrokerPipelinePersistenceMeta } from "@/modules/brokers/broker-pipeline.service";

export const dynamic = "force-dynamic";

export default async function BrokerAcquisitionPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect("/admin");

  if (!engineFlags.brokerAcquisitionV1) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-slate-200">
        <h1 className="text-xl font-semibold">Broker Acquisition</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enable <code className="rounded bg-slate-800 px-1">FEATURE_BROKER_ACQUISITION_V1=1</code> to use the pipeline.
        </p>
        <Link href="/admin" className="mt-4 inline-block text-sm text-emerald-400 hover:underline">
          ← Admin home
        </Link>
      </main>
    );
  }

  const persistence = getBrokerPipelinePersistenceMeta();
  const persistenceBanner =
    persistence.persistenceMode === "json_file" && persistence.jsonPathConfigured ? (
      <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
        <strong className="text-emerald-200">Persistent JSON storage enabled</strong>
        <span className="text-emerald-100/90">
          {" "}
          — <code className="rounded bg-black/30 px-1 text-xs">BROKER_PIPELINE_JSON_PATH</code> is set; prospects survive
          restarts when the path is writable.
        </span>
      </div>
    ) : (
      <div className="rounded-xl border border-amber-700/50 bg-amber-950/35 px-4 py-3 text-sm text-amber-100">
        <strong className="text-amber-200">In-memory only (data may reset)</strong>
        <span className="text-amber-100/90">
          {" "}
          — set <code className="rounded bg-black/30 px-1 text-xs">BROKER_PIPELINE_JSON_PATH</code> for durable JSON across
          deploys/restarts.
        </span>
      </div>
    );

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 text-slate-100">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-300">
          ← Admin home
        </Link>
        <Link href="/admin/broker-acquisition-legacy" className="text-sm text-emerald-400 hover:underline">
          Legacy DB prospect CRM →
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white">Broker Acquisition</h1>
      <p className="mt-1 text-sm text-slate-400">
        <span className="text-slate-300">V1 operator pipeline</span> — Kanban, scripts, and monitoring (not the legacy
        Prisma CRM). Export and the detailed checklist live in the dashboard below.
      </p>
      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
          <p className="font-semibold text-white">V1 operator pipeline</p>
          <p className="mt-1 text-xs text-slate-400">
            Use this page for the current acquisition engine. Database-backed first-10 outreach lives on{" "}
            <Link href="/admin/broker-acquisition-legacy" className="text-emerald-400 hover:underline">
              /admin/broker-acquisition-legacy
            </Link>{" "}
            (legacy CRM).
          </p>
        </div>
        {persistenceBanner}
      </div>
      <div className="mt-8">
        <BrokerPipelineDashboard />
      </div>
    </main>
  );
}
