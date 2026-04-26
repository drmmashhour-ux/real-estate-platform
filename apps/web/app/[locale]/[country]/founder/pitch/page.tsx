import { redirect } from "next/navigation";
import Link from "next/link";
import { founderSimulationFlags, lecipmLaunchInvestorFlags, launchSystemV1Flags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import { PitchConsole } from "@/components/founder-pitch/PitchConsole";

export const dynamic = "force-dynamic";

export default async function FounderPitchWordingPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/founder`;
  const path = `${basePath}/pitch`;

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
  const pitchOn = launchOn && founderSimulationFlags.investorPitchWordingV1;

  if (!pitchOn) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-zinc-400">
        <p className="font-medium text-zinc-200">Investor pitch wording disabled</p>
        <p className="mt-2 text-sm">
          Enable launch console flags plus <code className="text-amber-200/90">FEATURE_INVESTOR_PITCH_WORDING_V1</code>.
        </p>
        <Link href={basePath} className="mt-4 inline-block text-amber-200/90 hover:underline">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-zinc-800 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">LECIPM · founder</p>
        <h1 className="text-2xl font-semibold text-zinc-50">Investor pitch wording</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Generated copy is labeled as estimates. Edit slides before export; do not present projections as audited results.
        </p>
      </header>

      <PitchConsole basePath={basePath} />
    </div>
  );
}
