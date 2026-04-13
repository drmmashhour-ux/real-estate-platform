import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { getGrowthConnectorAdapter } from "@/src/modules/bnhub-growth-engine/connectors/registry";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const connectors = await prisma.bnhubGrowthConnector.findMany({ orderBy: { connectorCode: "asc" } });

  return (
    <HubLayout title="Growth connectors" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-6">
        <Link href="/admin/bnhub/growth" className="text-sm text-amber-400">
          ← Dashboard
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Connectors</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Tokens and secrets stay server-side only (<code className="text-zinc-300">bnhub_connector_tokens</code>,
            env vars). Never put provider secrets in <code className="text-zinc-300">NEXT_PUBLIC_*</code>.
          </p>
        </div>
        <ul className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 text-sm">
          {connectors.map((c) => {
            const adapter = getGrowthConnectorAdapter(c.connectorCode);
            const envKeys = adapter?.requiredEnvKeys ?? [];
            const caps = adapter?.getCapabilities();
            return (
              <li key={c.id} className="px-4 py-4">
                <p className="font-medium text-white">{c.name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {c.connectorCode} · {c.connectorType} ·{" "}
                  <span className="text-amber-300">{c.status}</span>
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  {caps?.realApiReady ? (
                    <span className="text-emerald-400/90">Live API path</span>
                  ) : (
                    <span className="text-zinc-500">Mock / pending — {caps?.pendingReason ?? "integration TBD"}</span>
                  )}
                </p>
                {envKeys.length > 0 ? (
                  <p className="mt-2 font-mono text-[11px] leading-relaxed text-zinc-500">
                    Required env (readiness): {envKeys.join(", ")}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-zinc-600">No extra env keys documented for this adapter.</p>
                )}
                <p className="mt-2 text-[11px] text-zinc-600">
                  Webhooks: verify signatures in production (Meta <code className="text-zinc-500">x-hub-signature-256</code>
                  , Google token query/header, TikTok secret + signature). Apply platform rate limits and backoff in the
                  connector layer.
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </HubLayout>
  );
}
