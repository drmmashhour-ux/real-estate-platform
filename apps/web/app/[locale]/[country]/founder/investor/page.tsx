import { redirect } from "next/navigation";
import Link from "next/link";
import { launchSystemV1Flags, lecipmLaunchInvestorFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import { buildFullInvestorPitchPackage } from "@/modules/investor-pitch/pitch.service";
import { PitchPreview } from "@/components/launch-system/PitchPreview";
import { InvestorDashboard } from "@/components/launch-system/InvestorDashboard";

export const dynamic = "force-dynamic";

export default async function FounderInvestorPitchPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/founder`;
  const path = `${basePath}/investor`;

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

  const pitchOn = launchSystemV1Flags.investorPitchDeckV1 && lecipmLaunchInvestorFlags.investorMetricsV1;
  if (!pitchOn) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-zinc-400">
        <p className="font-medium text-zinc-200">Investor pitch module disabled</p>
        <p className="mt-2 text-sm">
          Enable <code className="text-amber-200/90">FEATURE_INVESTOR_PITCH_V1</code> and{" "}
          <code className="text-amber-200/90">FEATURE_INVESTOR_METRICS_V1</code>.
        </p>
        <Link href={`${basePath}/launch`} className="mt-4 inline-block text-amber-200/90 hover:underline">
          ← Launch
        </Link>
      </div>
    );
  }

  const pkg = await buildFullInvestorPitchPackage();

  return (
    <div className="space-y-8">
      <header className="border-b border-zinc-800 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">LECIPM · investor</p>
        <h1 className="text-2xl font-semibold text-zinc-50">Pitch deck (preview)</h1>
        <p className="mt-1 text-sm text-zinc-500">{pkg.narrative}</p>
        <nav className="mt-4 flex flex-wrap gap-4">
          <Link href={`${basePath}/launch`} className="text-sm text-amber-200/90 hover:underline">
            ← Launch console
          </Link>
        </nav>
      </header>

      <InvestorDashboard basePath={basePath} showPitchLinks />

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Export</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Authenticated POST <code className="text-zinc-400">/api/investor/export</code> with{" "}
          <code className="text-zinc-400">{`{ "kind": "pitch_markdown" | "pitch_html" }`}</code> — same session cookie as
          this page.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200">Slides (preview)</h2>
        <div className="mt-4">
          <PitchPreview slides={pkg.deck.slides} />
        </div>
      </section>
    </div>
  );
}
