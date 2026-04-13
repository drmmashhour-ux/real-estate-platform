import Link from "next/link";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { listContentJobs } from "@/lib/content-automation/dao";
import type { ContentAutomationJobStatus, ContentAutomationPlatformTarget } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminGrowthAutomationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const listingId = typeof sp.listing === "string" ? sp.listing : undefined;
  const status = typeof sp.status === "string" ? (sp.status as ContentAutomationJobStatus) : undefined;
  const platformTarget =
    typeof sp.platform === "string" ? (sp.platform as ContentAutomationPlatformTarget) : undefined;

  let rows: Awaited<ReturnType<typeof listContentJobs>> = [];
  let loadError: string | null = null;
  try {
    rows = await listContentJobs({ listingId, status, platformTarget, take: 80 });
  } catch {
    loadError =
      "Could not load jobs. Apply Prisma migration for `content_jobs` (see docs/growth/full-automation.md).";
  }

  const q = (extra: Record<string, string | undefined>) => {
    const base = new URLSearchParams();
    if (listingId) base.set("listing", listingId);
    if (status) base.set("status", status);
    if (platformTarget) base.set("platform", platformTarget);
    for (const [k, v] of Object.entries(extra)) {
      if (v) base.set(k, v);
      else base.delete(k);
    }
    const s = base.toString();
    return s ? `?${s}` : "";
  };

  return (
    <HubLayout title="Growth automation" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 text-white">
        <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl text-amber-400">LECIPM growth automation</h1>
            <p className="mt-1 text-sm text-zinc-500">
              OpenAI structured packs → Runway/Pictory video → Metricool / direct social. All assets tied to BNHUB
              listings; approval mode from env (
              <code className="text-zinc-400">CONTENT_AUTOMATION_APPROVAL_MODE</code>).
            </p>
            {loadError ? <p className="mt-2 text-sm text-amber-300">{loadError}</p> : null}
            <p className="mt-3 rounded-xl border border-emerald-900/40 bg-emerald-950/25 px-3 py-2 text-sm text-emerald-100/90">
              Tie generated assets to outcomes in{" "}
              <Link href="/admin/content-intelligence" className="font-medium text-emerald-300 underline">
                Content intelligence
              </Link>{" "}
              (scores, winners, recommendations). Browse published packs in{" "}
              <Link href="/admin/content/generated" className="text-emerald-300 underline">
                Generated content
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/content/generated"
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Generated content (i18n)
            </Link>
            <Link
              href="/admin/overview"
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Control tower
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <span className="text-zinc-500">Status:</span>
          <Link href={q({ status: undefined })} className="text-emerald-400 hover:underline">
            All
          </Link>
          {(["QUEUED", "GENERATING_COPY", "GENERATING_VIDEO", "READY", "SCHEDULED", "PUBLISHED", "FAILED"] as const).map(
            (s) => (
              <Link key={s} href={q({ status: s })} className="text-zinc-400 hover:text-amber-400">
                {s}
              </Link>
            )
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <span className="text-zinc-500">Platform target:</span>
          <Link href={q({ platform: undefined })} className="text-emerald-400 hover:underline">
            All
          </Link>
          {(["TIKTOK", "INSTAGRAM", "BOTH"] as const).map((p) => (
            <Link key={p} href={q({ platform: p })} className="text-zinc-400 hover:text-amber-400">
              {p}
            </Link>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Job</th>
                <th className="px-3 py-2">Listing</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Approval</th>
                <th className="px-3 py-2">Platforms</th>
                <th className="px-3 py-2">Copy / Video</th>
                <th className="px-3 py-2">Assets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-900/50">
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link href={`/admin/content/${row.id}`} className="text-amber-400 hover:underline">
                      {row.id.slice(0, 10)}…
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-zinc-300">
                    <span className="line-clamp-1">{row.shortTermListing.title}</span>
                    <span className="block text-xs text-zinc-500">{row.shortTermListing.city}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{row.status}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-500">{row.approvalMode}</td>
                  <td className="px-3 py-2 text-zinc-400">{row.platformTarget}</td>
                  <td className="px-3 py-2 text-xs text-zinc-500">
                    {row.lastCopyProvider ?? "—"} / {row.lastVideoProvider ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{row._count.assets}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && !loadError ? (
            <p className="p-6 text-center text-sm text-zinc-500">
              No jobs yet. Create from host listing edit, or POST /api/content-automation/run.
            </p>
          ) : null}
        </div>
      </div>
    </HubLayout>
  );
}
