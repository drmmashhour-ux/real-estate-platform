import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { engineFlags } from "@/config/feature-flags";
import { buildUnifiedListingReadModel } from "@/modules/unified-intelligence/unified-intelligence.service";
import { UnifiedListingIntelligencePanel } from "@/components/intelligence/admin/UnifiedListingIntelligencePanel";

export const dynamic = "force-dynamic";

export default async function AdminUnifiedIntelligencePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  const sp = searchParams ? await searchParams : {};
  const rawId = sp.listingId;
  const listingId = typeof rawId === "string" ? rawId.trim() : "";

  let model = null as Awaited<ReturnType<typeof buildUnifiedListingReadModel>> | null;
  if (listingId && engineFlags.unifiedIntelligenceV1) {
    const source = typeof sp.source === "string" ? sp.source : undefined;
    const regionListingKey = typeof sp.regionListingKey === "string" ? sp.regionListingKey : undefined;
    const regionCode = typeof sp.regionCode === "string" ? sp.regionCode : undefined;
    model = await buildUnifiedListingReadModel({
      listingId,
      ...(source === "web" || source === "syria" || source === "external" ? { source } : {}),
      regionListingKey,
      regionCode,
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-slate-100">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/admin/intelligence" className="text-slate-400 hover:text-slate-200">
          ← Intelligence hub
        </Link>
        <Link href="/admin/reports/audit" className="text-slate-400 hover:text-slate-200">
          Audit log
        </Link>
        <Link href="/admin/autonomy" className="text-slate-400 hover:text-slate-200">
          Controlled execution
        </Link>
        <Link href="/api/admin/dashboard-intelligence" className="text-slate-500 hover:text-slate-300">
          Marketplace dashboard JSON
        </Link>
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">Unified intelligence</p>
      <h1 className="mt-2 text-3xl font-semibold">Listing read model</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Deterministic read-only aggregation — canonical autonomy runs first, then CRM/regional signals and event timeline
        counts when enabled. No mutations and no preview-path execution.
      </p>

      {!engineFlags.unifiedIntelligenceV1 ? (
        <p className="mt-8 rounded-xl border border-amber-900/50 bg-amber-950/40 p-4 text-sm text-amber-100">
          Enable <code className="rounded bg-black/40 px-1 text-xs">FEATURE_UNIFIED_INTELLIGENCE_V1</code> to load this
          panel and the JSON APIs.
        </p>
      ) : (
        <>
          <form method="get" className="mt-8 flex flex-wrap items-end gap-3 border-b border-slate-800 pb-8">
            <label className="text-xs text-slate-500">
              Listing id
              <input
                name="listingId"
                defaultValue={listingId}
                className="ml-2 block min-w-[220px] rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                placeholder="CRM or regional id"
              />
            </label>
            <label className="text-xs text-slate-500">
              Source (optional)
              <select
                name="source"
                defaultValue={
                  typeof sp.source === "string" && ["web", "syria", "external"].includes(sp.source)
                    ? sp.source
                    : ""
                }
                className="ml-2 block rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="">auto</option>
                <option value="web">web</option>
                <option value="syria">syria</option>
                <option value="external">external</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Region listing key
              <input
                name="regionListingKey"
                defaultValue={typeof sp.regionListingKey === "string" ? sp.regionListingKey : ""}
                className="ml-2 block min-w-[260px] rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            >
              Load read model
            </button>
          </form>

          <div className="mt-10">
            <UnifiedListingIntelligencePanel
              model={model}
              disabledReason={
                listingId ? undefined : "Provide a listing id to load the unified read model (GET with query params)."
              }
            />
          </div>
        </>
      )}
    </main>
  );
}
