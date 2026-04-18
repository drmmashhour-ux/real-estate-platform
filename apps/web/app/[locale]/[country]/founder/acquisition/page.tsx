import { redirect } from "next/navigation";
import Link from "next/link";
import { launchSystemV1Flags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import { buildMontrealHostAcquisitionSnapshot } from "@/modules/host-acquisition/host-acquisition.service";
import { listOutreachLeads } from "@/modules/outreach-crm/crm.service";
import { HostAcquisitionPipeline } from "@/components/launch-system/HostAcquisitionPipeline";
import { OutreachTracker } from "@/components/launch-system/OutreachTracker";

export const dynamic = "force-dynamic";

export default async function FounderAcquisitionPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/founder`;
  const path = `${basePath}/acquisition`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(path)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) redirect(`/${locale}/${country}`);

  const session = await getExecutiveSession(user.id, user.role);
  if (!session || session.scope.kind !== "platform") {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Platform administrators only.</p>
        <Link href={basePath} className="mt-4 inline-block text-amber-200/90 hover:underline">
          ← Back
        </Link>
      </div>
    );
  }

  if (!launchSystemV1Flags.hostAcquisitionPipelineV1) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Host acquisition pipeline is disabled.</p>
        <p className="mt-2 text-xs">
          Set <code className="text-amber-200/90">FEATURE_HOST_ACQUISITION_PIPELINE_V1=1</code> or{" "}
          <code className="text-amber-200/90">FEATURE_HOST_ACQUISITION_V1=1</code>
        </p>
        <Link href={`${basePath}/launch`} className="mt-4 inline-block text-amber-200/90 hover:underline">
          ← Launch
        </Link>
      </div>
    );
  }

  const [snapshot, outreach] = await Promise.all([
    buildMontrealHostAcquisitionSnapshot(),
    listOutreachLeads(400),
  ]);

  return (
    <div className="space-y-8">
      <header className="border-b border-zinc-800 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">LECIPM · acquisition</p>
        <h1 className="text-2xl font-semibold text-zinc-50">Montreal host pipeline</h1>
        <p className="mt-1 text-sm text-zinc-500">
          CRM rows are manual — no auto-send. POST <code className="text-zinc-400">/api/acquisition/add-lead</code> to
          record outreach.
        </p>
        <nav className="mt-4 flex flex-wrap gap-4">
          <Link href={`${basePath}/launch`} className="text-sm text-amber-200/90 hover:underline">
            ← Launch console
          </Link>
        </nav>
      </header>

      <HostAcquisitionPipeline snapshot={snapshot} />
      <div>
        <h2 className="text-lg font-medium text-zinc-200">Outreach CRM</h2>
        <p className="mt-1 text-xs text-zinc-500">Law 25 — document consent before first marketing message.</p>
        <div className="mt-4">
          <OutreachTracker rows={outreach} />
        </div>
      </div>
    </div>
  );
}
