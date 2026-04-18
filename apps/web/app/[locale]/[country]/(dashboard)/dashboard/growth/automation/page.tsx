import Link from "next/link";
import { engineFlags } from "@/config/feature-flags";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { GrowthAutomationClient } from "@/components/growth/GrowthAutomationClient";

export const dynamic = "force-dynamic";

export default async function GrowthAutomationPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  await requireAuthenticatedUser();
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard`;

  if (!engineFlags.growthMachineV1) {
    return (
      <div>
        <p className="text-sm text-zinc-400">Enable FEATURE_GROWTH_MACHINE_V1.</p>
        <Link href={base} className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
          ← Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Automation</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Suggestions only. Re-run recomputes stale-lead and draft signals — nothing is sent automatically.
        </p>
      </div>
      <GrowthAutomationClient />
    </div>
  );
}
