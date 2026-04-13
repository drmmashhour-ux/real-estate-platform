import { redirect } from "next/navigation";
import Link from "next/link";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import {
  generateAssetsForCampaign,
  getGrowthCampaignById,
  launchCampaign,
  publishDistribution,
} from "@/src/modules/bnhub-growth-engine/services/growthCampaignService";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const { id } = await params;
  const c = await getGrowthCampaignById(id);
  if (!c) redirect("/admin/bnhub/growth/campaigns");

  async function doGenerate() {
    "use server";
    const gid = await getGuestId();
    if (!gid || !(await isPlatformAdmin(gid))) return;
    await generateAssetsForCampaign(id);
  }

  async function doLaunch(formData: FormData) {
    "use server";
    const gid = await getGuestId();
    if (!gid || !(await isPlatformAdmin(gid))) return;
    const ext = formData.get("external") === "on";
    const confirm = formData.get("confirmExternal") === "on";
    await launchCampaign(id, {
      adminApprovedExternal: ext,
      confirmIrreversibleExternal: confirm,
      actorId: gid,
    });
  }

  async function doPublishDist(formData: FormData) {
    "use server";
    const gid = await getGuestId();
    if (!gid || !(await isPlatformAdmin(gid))) return;
    const distId = String(formData.get("distId") ?? "");
    const ext = formData.get("external") === "on";
    const confirm = formData.get("confirmDistExternal") === "on";
    if (distId) {
      await publishDistribution(distId, {
        adminApprovedExternal: ext,
        confirmIrreversibleExternal: confirm,
        actorId: gid,
      });
    }
  }

  return (
    <HubLayout title="Campaign" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-6 text-white">
        <Link href="/admin/bnhub/growth/campaigns" className="text-sm text-amber-400">
          ← Campaigns
        </Link>
        <h1 className="text-2xl font-bold">{c.campaignName}</h1>
        <p className="text-sm text-zinc-400">
          {c.listing.title} · autonomy {c.autonomyLevel} · {c.status}
        </p>
        <p className="text-xs text-zinc-500">
          ROI / spend on distributions are <span className="text-amber-200/80">platform-attributed estimates</span> until
          ad connectors sync real metrics. Internal channels are real; Meta/Google/TikTok are mock or pending until API
          keys and review are complete.
        </p>
        {c.promoSlug ? (
          <p className="text-sm">
            Promo landing:{" "}
            <a className="text-amber-400 underline" href={`/bnhub/promo/${c.promoSlug}`} target="_blank" rel="noreferrer">
              /bnhub/promo/{c.promoSlug}
            </a>
          </p>
        ) : null}
        <pre className="max-h-48 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-300 whitespace-pre-wrap">
          {c.aiStrategySummary}
        </pre>
        <form action={doGenerate} className="inline">
          <button type="submit" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950">
            Generate / refresh assets
          </button>
        </form>
        <form action={doLaunch} className="flex flex-col gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Launch</p>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input type="checkbox" name="external" className="rounded border-zinc-600" />
            Include external connectors in plan (still blocked until APIs are live)
          </label>
          <label className="flex items-center gap-2 text-sm text-amber-200/90">
            <input type="checkbox" name="confirmExternal" className="rounded border-amber-600/60" />
            I understand external delivery may incur real ad spend
          </label>
          <button type="submit" className="w-fit rounded-xl border border-zinc-600 px-4 py-2 text-sm">
            Launch / sync distributions
          </button>
        </form>
        <div>
          <h2 className="text-lg font-semibold">Distribution timeline</h2>
          <p className="mt-1 text-xs text-zinc-500">Newest first. “Mock / pending” = no paid API path yet.</p>
          <ul className="mt-3 space-y-3 text-sm">
            {[...c.distributions]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((d) => {
                const internal = ["internal_homepage", "internal_search_boost", "internal_email"].includes(
                  d.connector.connectorCode
                );
                return (
                  <li
                    key={d.id}
                    className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-zinc-200">{d.connector.connectorCode}</p>
                      <p className="text-xs text-zinc-500">
                        {d.distributionStatus}
                        {d.publishedAt ? ` · published ${new Date(d.publishedAt).toLocaleString()}` : ""}
                        {d.publishLockedUntil && new Date(d.publishLockedUntil) > new Date()
                          ? ` · locked until ${new Date(d.publishLockedUntil).toLocaleString()}`
                          : ""}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-600">
                        {internal ? "Real (internal)" : "Mock / pending external"}
                      </p>
                    </div>
                    <form action={doPublishDist} className="flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-2 sm:border-t-0 sm:pt-0">
                      <input type="hidden" name="distId" value={d.id} />
                      <label className="flex items-center gap-1 text-xs text-zinc-500">
                        <input type="checkbox" name="external" /> Admin external bypass
                      </label>
                      <label className="flex items-center gap-1 text-xs text-amber-200/80">
                        <input type="checkbox" name="confirmDistExternal" /> Confirm spend
                      </label>
                      <button type="submit" className="text-xs font-medium text-amber-400">
                        Publish
                      </button>
                    </form>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </HubLayout>
  );
}
