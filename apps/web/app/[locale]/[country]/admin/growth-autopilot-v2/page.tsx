import Link from "next/link";
import { redirect } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAdminSession } from "@/lib/admin/require-admin";
import { engineFlags, intelligenceFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export default async function GrowthAutopilotV2AdminPage() {
  const auth = await requireAdminSession();
  if (!auth.ok) redirect("/auth/login?returnUrl=/admin/growth-autopilot-v2");

  const [
    seoOpps,
    seoDrafts,
    socialCand,
    campaignCand,
    refAttr,
    expSnaps,
    suppressionLogs,
    fsboAutopilotPending,
  ] = await Promise.all([
    prisma.seoPageOpportunity.count(),
    prisma.seoPageDraft.count(),
    prisma.socialContentCandidate.count(),
    prisma.growthAutopilotCampaignCandidate.count(),
    prisma.referralGrowthAttribution.count(),
    prisma.experimentResultSnapshot.count(),
    prisma.campaignSuppressionLog.count(),
    intelligenceFlags.autopilotV2
      ? prisma.autopilotV2Suggestion.count({ where: { status: "pending" } })
      : Promise.resolve(0),
  ]);

  return (
    <main className="min-h-screen bg-ds-bg px-4 py-8 text-ds-text sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-ds-gold hover:text-amber-200">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ds-text">Growth Autopilot v2</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ds-text-secondary">
          Candidates and drafts are review-first. No bulk email or social posting from this surface. Suppression logs
          record cooldowns and a <span className="text-ds-text/90">sample</span> of duplicate-window skips (full dedupe
          still increments scan <code className="text-ds-gold/90">suppressed</code>).
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-ds-border bg-ds-card p-5 shadow-ds-soft">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-gold">Feature flags</h2>
            <ul className="mt-3 space-y-1 font-mono text-xs text-ds-text-secondary">
              <li>FEATURE_GROWTH_V2: {String(engineFlags.growthV2)}</li>
              <li>FEATURE_SEO_PAGE_GENERATOR_V2: {String(engineFlags.seoPageGeneratorV2)}</li>
              <li>FEATURE_SEO_DRAFT_GENERATION_V2: {String(engineFlags.seoDraftGenerationV2)}</li>
              <li>FEATURE_REFERRAL_ENGINE_V2: {String(engineFlags.referralEngineV2)}</li>
              <li>FEATURE_SOCIAL_CONTENT_AUTOPILOT_V2: {String(engineFlags.socialContentAutopilotV2)}</li>
              <li>FEATURE_CAMPAIGN_AUTOPILOT_V2: {String(engineFlags.campaignAutopilotV2)}</li>
              <li>FEATURE_EXPERIMENTS_V1: {String(engineFlags.experimentsV1)}</li>
              <li>FEATURE_AUTOPILOT_V2 (FSBO suggestions): {String(intelligenceFlags.autopilotV2)}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-ds-border bg-ds-card p-5 shadow-ds-soft">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-gold">Queues (source: DB)</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-ds-text/95">
              <li className="flex justify-between gap-2 border-b border-ds-border pb-1">
                <span className="text-ds-text-secondary">SEO opportunities</span>
                <span className="tabular-nums text-ds-text">{seoOpps}</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-ds-border pb-1">
                <span className="text-ds-text-secondary">SEO drafts</span>
                <span className="tabular-nums text-ds-text">{seoDrafts}</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-ds-border pb-1">
                <span className="text-ds-text-secondary">Social content candidates</span>
                <span className="tabular-nums text-ds-text">{socialCand}</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-ds-border pb-1">
                <span className="text-ds-text-secondary">Campaign candidates (v2)</span>
                <span className="tabular-nums text-ds-text">{campaignCand}</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-ds-border pb-1">
                <span className="text-ds-text-secondary">Referral attributions (v2)</span>
                <span className="tabular-nums text-ds-text">{refAttr}</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-ds-border pb-1">
                <span className="text-ds-text-secondary">Experiment snapshots</span>
                <span className="tabular-nums text-ds-text">{expSnaps}</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-ds-border pb-1">
                <span className="text-ds-text-secondary">Campaign suppression logs</span>
                <span className="tabular-nums text-ds-gold/95">{suppressionLogs}</span>
              </li>
              <li className="flex justify-between gap-2 pt-0.5">
                <span className="text-ds-text-secondary">FSBO Autopilot v2 (pending)</span>
                <span className="tabular-nums text-cyan-200/90">{fsboAutopilotPending}</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-ds-border bg-ds-surface/80 p-5 text-sm leading-relaxed text-ds-text-secondary shadow-ds-soft">
          <p>
            Internal cron (Bearer <code className="text-ds-gold/80">CRON_SECRET</code>):{" "}
            <code className="text-ds-gold/90">POST /api/internal/growth-v2/orchestrator</code>,{" "}
            <code className="text-ds-gold/90">/api/internal/growth-v2/seo/scan</code>,{" "}
            <code className="text-ds-gold/90">/api/internal/growth-v2/seo/generate-drafts</code>,{" "}
            <code className="text-ds-gold/90">/api/internal/growth-v2/social/scan</code>,{" "}
            <code className="text-ds-gold/90">/api/internal/growth-v2/campaigns/scan</code>,{" "}
            <code className="text-ds-gold/90">/api/internal/growth-v2/referrals/scan</code>,{" "}
            <code className="text-ds-gold/90">POST /api/internal/experiments/aggregate</code> with{" "}
            <code className="text-ds-gold/80">experimentId</code>.
          </p>
        </section>
      </div>
    </main>
  );
}
