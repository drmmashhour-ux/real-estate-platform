import Link from "next/link";
import { redirect } from "next/navigation";
import { revenueV4Flags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import { SalesWorkbench } from "@/components/sales/SalesWorkbench";

export const dynamic = "force-dynamic";

export default async function FounderSalesPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/founder`;
  const path = `${basePath}/sales`;

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
        <p>Sales console is limited to platform administrators.</p>
        <Link href={basePath} className="mt-4 inline-block text-amber-200/90 hover:underline">
          ← Back
        </Link>
      </div>
    );
  }

  if (!revenueV4Flags.gtmEngineV1) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>GTM engine disabled.</p>
        <p className="mt-2 text-xs">
          Set <code className="text-amber-200/90">FEATURE_GTM_ENGINE_V1=1</code>
        </p>
        <Link href={basePath} className="mt-4 inline-block text-amber-200/90 hover:underline">
          ← Espace fondateur
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-zinc-800 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">LECIPM · sales</p>
        <h1 className="text-2xl font-semibold text-zinc-50">GTM & sales workbench</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Drafts are review-first; ROI tools show estimates with your inputs — never guaranteed outcomes.
        </p>
        <Link href={basePath} className="mt-4 inline-block text-sm text-amber-200/90 hover:underline">
          ← Espace fondateur
        </Link>
      </header>
      <SalesWorkbench marketDefault="Montréal" />
    </div>
  );
}
