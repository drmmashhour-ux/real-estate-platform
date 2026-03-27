"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { g } from "@/src/modules/bnhub-growth-engine/components/growth-ui-classes";

type DistRow = {
  id: string;
  distributionStatus: string;
  createdAt: string;
  publishedAt?: string | null;
  publishLockedUntil?: string | null;
  connector: { connectorCode: string };
};

export default function Page() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [confirmSpend, setConfirmSpend] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const r = await fetch(`/api/bnhub/host/growth/campaigns/${id}`);
      const j = (await r.json()) as Record<string, unknown>;
      if (r.ok) setData(j);
    })();
  }, [id]);

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/bnhub/host/growth/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const r = await fetch(`/api/bnhub/host/growth/campaigns/${id}`);
    const j = (await r.json()) as Record<string, unknown>;
    if (r.ok) setData(j);
  }

  if (!data) return <p className="text-zinc-500">Loading…</p>;

  const promoSlug = data.promoSlug as string | null | undefined;
  const autonomy = data.autonomyLevel as string | undefined;
  const distributions = (data.distributions as DistRow[]) ?? [];
  const internalCodes = ["internal_homepage", "internal_search_boost", "internal_email"];
  const sorted = [...distributions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6 text-white">
      <Link href="/bnhub/host/growth" className="text-sm text-amber-400">
        ← Growth home
      </Link>
      <h1 className="text-2xl font-bold">{String(data.campaignName)}</h1>
      <p className="text-sm text-zinc-400">
        {String(data.status)} · autonomy {autonomy ?? "—"}
      </p>
      <p className="text-xs text-zinc-500">
        Internal connectors are real BNHub placements. External rows stay <span className="text-amber-200/80">mock/pending</span>{" "}
        until Meta/Google/TikTok APIs are connected. ROI labels are estimates until spend syncs.
      </p>
      {promoSlug ? (
        <a className="text-sm text-amber-400 underline" href={`/bnhub/promo/${promoSlug}`} target="_blank" rel="noreferrer">
          Promo landing (lead capture)
        </a>
      ) : null}
      <div className="flex flex-col gap-3">
        <button type="button" className={g.btn} onClick={() => void patch({ generateAssets: true })}>
          Generate assets
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-amber-200/90">
          <input
            type="checkbox"
            checked={confirmSpend}
            onChange={(e) => setConfirmSpend(e.target.checked)}
            className="rounded border-amber-600/60"
          />
          I understand a launch with external + full autopilot may incur ad spend (required for that path).
        </label>
        <button
          type="button"
          className={g.btnGhost}
          onClick={() =>
            void patch({
              approveAssets: true,
              launch: true,
              confirmIrreversibleExternal: confirmSpend,
            })
          }
        >
          Approve + launch
        </button>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-zinc-200">Distribution timeline</h2>
        <p className="text-xs text-zinc-500">Newest first</p>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          {sorted.map((d) => {
            const internal = internalCodes.includes(d.connector.connectorCode);
            return (
              <li key={d.id} className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2">
                <span className="font-medium text-zinc-200">{d.connector.connectorCode}</span>
                <span className="mx-2 text-zinc-600">·</span>
                {d.distributionStatus}
                {d.publishedAt ? (
                  <span className="block text-xs text-zinc-500">
                    Published {new Date(d.publishedAt).toLocaleString()}
                  </span>
                ) : null}
                {d.publishLockedUntil && new Date(d.publishLockedUntil) > new Date() ? (
                  <span className="block text-xs text-amber-200/70">
                    Retry locked until {new Date(d.publishLockedUntil).toLocaleString()}
                  </span>
                ) : null}
                <span className="mt-1 block text-[10px] uppercase tracking-wide text-zinc-600">
                  {internal ? "Real (internal)" : "Mock / pending external"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
