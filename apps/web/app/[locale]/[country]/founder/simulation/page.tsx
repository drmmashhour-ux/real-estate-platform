import { redirect } from "next/navigation";
import Link from "next/link";
import { founderSimulationFlags, lecipmLaunchInvestorFlags, launchSystemV1Flags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import { SimulationDashboard } from "@/components/founder-simulation/SimulationDashboard";

export const dynamic = "force-dynamic";

export default async function FounderSimulationPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/founder`;
  const path = `${basePath}/simulation`;

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

  const launchOn =
    lecipmLaunchInvestorFlags.lecipmLaunchInvestorSystemV1 || launchSystemV1Flags.launchSystemV1;
  const simOn =
    launchOn &&
    founderSimulationFlags.founderLaunchSimulationV1 &&
    founderSimulationFlags.montrealProjectionV1;

  if (!simOn) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-zinc-400">
        <p className="font-medium text-zinc-200">Montreal launch simulation disabled</p>
        <p className="mt-2 text-sm">
          Enable{" "}
          <code className="text-amber-200/90">FEATURE_LECIPM_LAUNCH_INVESTOR_SYSTEM_V1</code> or{" "}
          <code className="text-amber-200/90">FEATURE_LAUNCH_SYSTEM_V1</code>, plus{" "}
          <code className="text-amber-200/90">FEATURE_FOUNDER_LAUNCH_SIMULATION_V1</code> and{" "}
          <code className="text-amber-200/90">FEATURE_MONTREAL_PROJECTION_V1</code>.
        </p>
        <Link href={`${basePath}/launch`} className="mt-4 inline-block text-amber-200/90 hover:underline">
          ← Launch console
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-zinc-800 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">LECIPM · founder</p>
        <h1 className="text-2xl font-semibold text-zinc-50">3-month revenue simulation (Montreal)</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Projected estimates from editable assumptions — separate from actuals. Exports are labeled accordingly.
        </p>
        <nav className="mt-4 flex flex-wrap gap-4">
          <Link href={`${basePath}/pitch`} className="text-sm text-amber-200/90 hover:underline">
            Investor pitch wording →
          </Link>
          <Link href={`${basePath}/launch`} className="text-sm text-zinc-500 hover:text-zinc-300">
            Launch console
          </Link>
        </nav>
      </header>

      <SimulationDashboard basePath={basePath} />
    </div>
  );
}
