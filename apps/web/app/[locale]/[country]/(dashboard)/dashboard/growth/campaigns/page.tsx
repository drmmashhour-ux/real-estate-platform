import Link from "next/link";
import { engineFlags } from "@/config/feature-flags";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { GrowthCampaignsClient } from "@/components/growth/GrowthCampaignsClient";

export const dynamic = "force-dynamic";

export default async function GrowthCampaignsPage({
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
        <p className="text-sm text-zinc-400">Enable FEATURE_GROWTH_MACHINE_V1 to manage UTM campaigns here.</p>
        <Link href={base} className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
          ← Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Campaigns</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Saved <code className="text-zinc-400">MarketingCampaign</code> rows with UTM fields. ROI uses{" "}
          <code className="text-zinc-400">growth_events</code> matched to <code className="text-zinc-400">utm_campaign</code>{" "}
          and marketing performance events — never invented numbers.
        </p>
      </div>
      <GrowthCampaignsClient />
    </div>
  );
}
