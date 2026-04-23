import { redirect } from "next/navigation";
import Link from "next/link";
import { executiveDashboardFlags, founderWorkspaceFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import { FounderCopilotWorkspace } from "@/components/founder/FounderCopilotWorkspace";

export const dynamic = "force-dynamic";

export default async function FounderCopilotPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/founder`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/copilot`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) redirect(`/${locale}/${country}`);

  const session = await getExecutiveSession(user.id, user.role);
  if (!session) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Accès exécutif requis.</p>
      </div>
    );
  }

  if (!executiveDashboardFlags.executiveCompanyMetricsV1 || !founderWorkspaceFlags.founderAiCopilotV1) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Copilote fondateur désactivé.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={basePath} className="text-sm text-amber-200/80 hover:underline">
        ← Espace fondateur
      </Link>
      <h1 className="text-xl font-semibold">Copilote IA fondateur</h1>
      <FounderCopilotWorkspace />
    </div>
  );
}
