import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { MONTREAL_READY_CAMPAIGNS, buildTrackedLandingUrl } from "@/modules/ads";
import { buildCampaignTrackedUrl, listCampaigns } from "@/modules/campaigns/campaign.service";
import { CampaignsAdminClient, type CampaignRow } from "./campaigns-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  await requireAdminControlUserId();
  const [rawCampaigns, riskAlerts] = await Promise.all([listCampaigns(), getAdminRiskAlerts()]);
  const campaigns: CampaignRow[] = rawCampaigns.map((c) => ({
    ...c,
    trackedUrlFrCa: (() => {
      try {
        return buildCampaignTrackedUrl(c);
      } catch {
        return null;
      }
    })(),
  }));

  const montrealPresets = MONTREAL_READY_CAMPAIGNS.map((p) => ({
    ...p,
    trackedUrlFrCa: buildTrackedLandingUrl({
      localeCountryPrefix: "/fr/ca",
      landingPath: p.landingPath,
      utm: { utm_source: "google", utm_medium: "cpc", utm_campaign: p.utmCampaign },
    }),
    trackedUrlEnCa: buildTrackedLandingUrl({
      localeCountryPrefix: "/en/ca",
      landingPath: p.landingPath,
      utm: { utm_source: "google", utm_medium: "cpc", utm_campaign: p.utmCampaign },
    }),
  }));
  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={alerts}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Campaigns</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Canonical UTM sets + landing paths for Google Ads and internal tracking.
            </p>
          </div>
          <Link href="/admin/analytics" className="text-sm text-premium-gold hover:underline">
            ← Analytics
          </Link>
        </div>
        <CampaignsAdminClient initialCampaigns={campaigns} montrealPresets={montrealPresets} />
      </div>
    </LecipmControlShell>
  );
}
