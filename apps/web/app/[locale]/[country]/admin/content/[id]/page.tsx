import Link from "next/link";
import { notFound } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getContentJobDetail } from "@/lib/content-automation/dao";
import { buildSocialPayloadFromAssets } from "@/lib/content-automation/social-payload";
import { ContentAutomationAssetType } from "@prisma/client";
import { ContentJobActions } from "../content-job-actions";

export const dynamic = "force-dynamic";

export default async function AdminContentJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let job: Awaited<ReturnType<typeof getContentJobDetail>> = null;
  try {
    job = await getContentJobDetail(id);
  } catch {
    job = null;
  }
  if (!job) notFound();

  const socialPayload = buildSocialPayloadFromAssets(job.assets);
  const scripts = job.assets.filter((a) => a.assetType === ContentAutomationAssetType.SCRIPT);
  const videos = job.assets.filter((a) => a.assetType === ContentAutomationAssetType.VIDEO);
  const thumbs = job.assets.filter((a) => a.assetType === ContentAutomationAssetType.THUMBNAIL);

  return (
    <HubLayout title="Content job" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 text-white">
        <Link href="/admin/content" className="text-sm text-amber-400 hover:underline">
          ← All jobs
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Job {job.id}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {job.shortTermListing.title} · {job.shortTermListing.city} ({job.shortTermListing.listingCode})
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Status: <span className="text-zinc-200">{job.status}</span> · Platforms: {job.platformTarget} · Mode:{" "}
            {job.approvalMode}
          </p>
          <p className="text-xs text-zinc-500">
            Copy: {job.lastCopyProvider ?? "—"} · Video: {job.lastVideoProvider ?? "—"}
          </p>
          {job.errorMessage ? (
            <p className="mt-2 rounded-lg border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">{job.errorMessage}</p>
          ) : null}
        </div>

        <ContentJobActions
          jobId={job.id}
          formattedCaption={socialPayload.formattedCaption}
          mediaUrl={socialPayload.mediaUrl}
          socialPosts={job.socialPosts.map((p) => ({
            id: p.id,
            platform: p.platform,
            status: p.status,
            publishMode: p.publishMode,
            externalPostId: p.externalPostId,
          }))}
        />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Scripts / packs</h2>
          <div className="space-y-4">
            {scripts.map((a) => {
              const meta = a.metadataJson as {
                pack?: { style?: string; hook?: string; cta?: string; valid?: boolean; invalidReason?: string };
              } | null;
              const pack = meta?.pack;
              return (
                <div key={a.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                  <p className="text-xs font-medium text-amber-400">
                    {pack?.style ?? "script"}{" "}
                    {pack?.valid === false ? (
                      <span className="text-red-400">(invalid{pack?.invalidReason ? `: ${pack.invalidReason}` : ""})</span>
                    ) : null}
                  </p>
                  {pack?.hook ? <p className="mt-1 text-sm text-zinc-300">Hook: {pack.hook}</p> : null}
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-zinc-400">{a.textContent}</pre>
                  {pack?.cta ? <p className="mt-2 text-xs text-zinc-500">CTA: {pack.cta}</p> : null}
                </div>
              );
            })}
          </div>
        </section>

        {(videos.length > 0 || thumbs.length > 0) && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Video</h2>
            {videos.map((v) => (
              <div key={v.id} className="rounded-xl border border-zinc-800 p-2">
                {v.mediaUrl ? (
                  <video src={v.mediaUrl} controls className="max-h-[480px] w-full rounded-lg" preload="metadata" />
                ) : null}
                <p className="mt-1 break-all text-xs text-zinc-500">{v.mediaUrl}</p>
              </div>
            ))}
          </section>
        )}

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Publishing</h2>
          {job.socialPosts.length === 0 ? (
            <p className="text-sm text-zinc-500">No social posts yet.</p>
          ) : (
            <ul className="space-y-2 text-sm text-zinc-400">
              {job.socialPosts.map((p) => (
                <li key={p.id} className="rounded-lg border border-zinc-800 px-3 py-2">
                  {p.platform} · {p.status} · {p.publishMode}
                  {p.externalPostId ? <span className="ml-2 font-mono text-xs">{p.externalPostId}</span> : null}
                  <span className="ml-2 text-xs text-zinc-600">
                    {p.scheduledAt ? `scheduled ${p.scheduledAt.toISOString()}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Performance snapshots</h2>
          <ul className="space-y-1 text-xs text-zinc-500">
            {job.socialPosts.flatMap((p) =>
              p.performanceSnapshots.map((s) => (
                <li key={s.id}>
                  {s.pulledAt.toISOString()} · views {s.views} · likes {s.likes} · clicks {s.clicks}
                </li>
              )),
            )}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Job log</h2>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-xs text-zinc-500">
            {job.logs.map((log) => (
              <li key={log.id} className="border-b border-zinc-800/80 py-1">
                <span className="text-zinc-400">{log.createdAt.toISOString()}</span>{" "}
                <span className="text-amber-400/90">{log.eventType}</span> — {log.message}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </HubLayout>
  );
}
