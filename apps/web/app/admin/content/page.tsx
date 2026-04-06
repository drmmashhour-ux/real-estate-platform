import Link from "next/link";
import { listGeneratedContent } from "@/lib/content/dao";
import { resolveLaunchFlags } from "@/lib/launch/resolve-launch-flags";
import { ContentRowActions } from "./content-row-actions";
import { SeedTemplateDemoButton } from "./seed-demo-button";

export const dynamic = "force-dynamic";

export default async function AdminGeneratedContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const locale = typeof sp.locale === "string" ? sp.locale : undefined;
  const marketCode = typeof sp.market === "string" ? sp.market : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const surface = typeof sp.surface === "string" ? sp.surface : undefined;
  const entityType = typeof sp.entity === "string" ? sp.entity : undefined;

  const launch = await resolveLaunchFlags();

  let rows: Awaited<ReturnType<typeof listGeneratedContent>> = [];
  let loadError: string | null = null;
  try {
    rows = await listGeneratedContent({
      take: 80,
      locale,
      marketCode,
      status,
      surface,
      entityType,
    });
  } catch {
    loadError =
      "Could not load generated content (run Prisma migrate if `lecipm_generated_content` is missing).";
  }

  const q = (extra: Record<string, string>) => {
    const base = new URLSearchParams();
    if (locale) base.set("locale", locale);
    if (marketCode) base.set("market", marketCode);
    if (status) base.set("status", status);
    if (surface) base.set("surface", surface);
    if (entityType) base.set("entity", entityType);
    for (const [k, v] of Object.entries(extra)) {
      if (v) base.set(k, v);
      else base.delete(k);
    }
    const s = base.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl text-[#D4AF37]">Generated content</h1>
            <p className="mt-1 text-sm text-white/50">
              Review-before-publish pipeline (EN / FR / AR). AI/hybrid rows require{" "}
              <code className="text-white/70">ENABLE_AI_CONTENT_PUBLISH=1</code> to publish.
            </p>
            <p className="mt-1 text-xs text-white/40">
              Launch flags: AI engine = {String(launch.enableAiContentEngine)} · AI publish ={" "}
              {String(launch.enableAiContentPublish)}
            </p>
            {loadError ? <p className="mt-2 text-sm text-amber-300">{loadError}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <SeedTemplateDemoButton />
            <Link
              href="/admin"
              className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              ← Admin home
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <span className="text-white/40">Locale:</span>
          {["en", "fr", "ar"].map((l) => (
            <Link
              key={l}
              href={`/admin/content${q({ locale: locale === l ? "" : l })}`}
              className={`rounded px-2 py-1 ${locale === l ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/60 hover:underline"}`}
            >
              {l}
            </Link>
          ))}
          <span className="mx-2 text-white/30">|</span>
          <span className="text-white/40">Status:</span>
          {["draft", "pending_review", "approved", "published", "rejected"].map((s) => (
            <Link
              key={s}
              href={`/admin/content${q({ status: status === s ? "" : s })}`}
              className={`rounded px-2 py-1 ${status === s ? "bg-white/10" : "text-white/60 hover:underline"}`}
            >
              {s}
            </Link>
          ))}
        </div>

        <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-white/40">
              <tr>
                <th className="p-3">Surface</th>
                <th className="p-3">Locale</th>
                <th className="p-3">Market</th>
                <th className="p-3">Status</th>
                <th className="p-3">Source</th>
                <th className="p-3">Title</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-white/45">
                    No rows yet. Run a template demo or wire generators to cron.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 font-mono text-xs text-white/70">{r.surface}</td>
                    <td className="p-3">{r.locale}</td>
                    <td className="p-3">{r.marketCode}</td>
                    <td className="p-3">{r.status}</td>
                    <td className="p-3">{r.generationSource}</td>
                    <td className="p-3 max-w-[200px] truncate text-white/80">{r.title ?? r.seoTitle ?? "—"}</td>
                    <td className="p-3">
                      <ContentRowActions id={r.id} status={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
