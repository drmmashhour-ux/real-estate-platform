import { redirect } from "next/navigation";
import Link from "next/link";
import { founderSimulationFlags, lecipmLaunchInvestorFlags, launchSystemV1Flags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import { buildEarlyTractionBundle } from "@/modules/early-traction/early-traction.service";
import { buildFirstUsersSnapshot } from "@/modules/early-traction/first-users-tracker.service";
import { buildChannelPerformance } from "@/modules/scaling-growth/channel-performance.service";
import { buildInvestorMetricTable } from "@/modules/investor-metrics/investor-metrics.service";
import { buildTractionMilestones } from "@/modules/investor-story/milestone-tracker.service";
import { buildPositioningBundle } from "@/modules/positioning/positioning.service";
import { LaunchDashboard } from "@/components/launch/LaunchDashboard";
import { buildLaunchChecklist } from "@/modules/launch/launch-checklist.service";
import { LaunchChecklistPanel } from "@/components/launch-system/LaunchChecklistPanel";

export const dynamic = "force-dynamic";

export default async function FounderLaunchPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/founder`;
  const launchPath = `${basePath}/launch`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(launchPath)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) redirect(`/${locale}/${country}`);

  const session = await getExecutiveSession(user.id, user.role);
  if (!session || session.scope.kind !== "platform") {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Launch & investor console is limited to platform administrators.</p>
        <Link href={basePath} className="mt-4 inline-block text-amber-200/90 hover:underline">
          ← Back
        </Link>
      </div>
    );
  }

  const launchConsoleEnabled =
    lecipmLaunchInvestorFlags.lecipmLaunchInvestorSystemV1 || launchSystemV1Flags.launchSystemV1;
  if (!launchConsoleEnabled) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Launch console is disabled.</p>
        <p className="mt-2 text-xs">
          Set <code className="text-amber-200/90">FEATURE_LECIPM_LAUNCH_INVESTOR_SYSTEM_V1=1</code> or{" "}
          <code className="text-amber-200/90">FEATURE_LAUNCH_SYSTEM_V1=1</code>
        </p>
        <Link href={basePath} className="mt-4 inline-block text-amber-200/90 hover:underline">
          ← Espace fondateur
        </Link>
      </div>
    );
  }

  const launchChecklist = launchSystemV1Flags.launchSystemV1 ? await buildLaunchChecklist() : null;

  const [tractionData, channels, metricTable, tractionMs, positioning] = await Promise.all([
    lecipmLaunchInvestorFlags.earlyTractionV1
      ? buildEarlyTractionBundle(100).then((b) => b.firstUsers)
      : buildFirstUsersSnapshot(100),
    lecipmLaunchInvestorFlags.scalingGrowthV1 ? buildChannelPerformance(90) : null,
    lecipmLaunchInvestorFlags.investorMetricsV1 ? buildInvestorMetricTable() : null,
    buildTractionMilestones(),
    lecipmLaunchInvestorFlags.positioningEngineV1 ? Promise.resolve(buildPositioningBundle("airbnb")) : null,
  ]);

  if (lecipmLaunchInvestorFlags.investorMetricsV1 && !metricTable) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-zinc-400">
        <p className="font-medium text-zinc-200">Investor metrics unavailable</p>
        <p className="mt-2 text-sm">
          Enable <code className="text-amber-200/90">FEATURE_INVESTOR_METRICS_V1</code> for this dashboard.
        </p>
        <Link href={basePath} className="mt-4 inline-block text-amber-200/90 hover:underline">
          ← Espace fondateur
        </Link>
      </div>
    );
  }

  const investorRows = metricTable?.rows ?? [];

  return (
    <div className="space-y-6">
      <header className="border-b border-zinc-800 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">LECIPM · launch</p>
        <h1 className="text-2xl font-semibold text-zinc-50">Launch + investor console</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Real database metrics, auditable exports, qualitative positioning (no competitor market-share claims).
        </p>
        <nav className="mt-4 flex flex-wrap gap-4">
          <Link href={basePath} className="text-sm text-amber-200/90 hover:underline">
            ← Espace fondateur
          </Link>
          {launchSystemV1Flags.hostAcquisitionPipelineV1 ? (
            <Link href={`${basePath}/acquisition`} className="text-sm text-emerald-200/90 hover:underline">
              Host acquisition →
            </Link>
          ) : null}
          {launchSystemV1Flags.investorPitchDeckV1 ? (
            <Link href={`${basePath}/investor`} className="text-sm text-emerald-200/90 hover:underline">
              Investor pitch →
            </Link>
          ) : null}
          {founderSimulationFlags.founderLaunchSimulationV1 && founderSimulationFlags.montrealProjectionV1 ? (
            <Link href={`${basePath}/simulation`} className="text-sm text-sky-200/90 hover:underline">
              3-mo simulation →
            </Link>
          ) : null}
          {founderSimulationFlags.investorPitchWordingV1 ? (
            <Link href={`${basePath}/pitch`} className="text-sm text-sky-200/90 hover:underline">
              Pitch wording →
            </Link>
          ) : null}
        </nav>
      </header>

      {launchChecklist ? <LaunchChecklistPanel data={launchChecklist} /> : null}

      <LaunchDashboard
        basePath={basePath}
        traction={tractionData}
        channels={
          channels
            ? { channels: channels.channels, bestChannelBySignups: channels.bestChannelBySignups }
            : null
        }
        investorRows={investorRows}
        milestones={tractionMs.milestones}
        positioning={
          positioning
            ? { focus: positioning.focus, differentiation: positioning.differentiation }
            : null
        }
      />
    </div>
  );
}
