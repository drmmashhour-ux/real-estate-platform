import Link from "next/link";
import { engineFlags } from "@/config/feature-flags";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { GrowthLeadsClient } from "@/components/growth/GrowthLeadsClient";

export const dynamic = "force-dynamic";

export default async function GrowthLeadsPage({
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
        <h1 className="text-xl font-bold">Leads</h1>
        <p className="mt-1 text-sm text-zinc-500">Scoped to your role — same rows as CRM, no synthetic leads.</p>
      </div>
      <GrowthLeadsClient locale={locale} country={country} />
    </div>
  );
}
