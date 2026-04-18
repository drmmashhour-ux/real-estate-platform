import Link from "next/link";
import { redirect } from "next/navigation";
import { engineFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { BrokerPipelineDashboard } from "@/components/brokers/BrokerPipelineDashboard";

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
        Track prospects, run outreach, and convert paying brokers — V1 pipeline (in-memory / optional JSON file).
      </p>
      <div className="mt-8">
        <BrokerPipelineDashboard />
      </div>
    </main>
  );
}
