"use client";

import { useCallback, useEffect, useState } from "react";
import { ListingHealthCard } from "./ListingHealthCard";
import { MarketingDraftList } from "./MarketingDraftList";
import { MarketingOpportunityPanel } from "./MarketingOpportunityPanel";

export function ListingGrowthWorkspace({ listingId, basePath }: { listingId: string; basePath: string }) {
  const [intel, setIntel] = useState<unknown>(null);
  const [drafts, setDrafts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const [i, d] = await Promise.all([
        fetch(`/api/broker/listings/${listingId}/marketing-intelligence`, { credentials: "include" }),
        fetch(`/api/broker/listings/${listingId}/marketing-drafts`, { credentials: "include" }),
      ]);
      const ij = await i.json();
      const dj = await d.json();
      if (i.ok) setIntel(ij.intelligence);
      if (d.ok) setDrafts((dj.drafts as unknown[]) ?? []);
    } catch {
      setMsg("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      {msg && <p className="text-sm text-red-400/90">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            setMsg(null);
            const res = await fetch(`/api/broker/listings/${listingId}/marketing-intelligence/run`, {
              method: "POST",
              credentials: "include",
            });
            if (!res.ok) setMsg("Impossible de lancer l’analyse");
            else await refresh();
          }}
          className="rounded-lg border border-amber-700/50 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-100 hover:bg-amber-500/20"
        >
          Analyser &amp; suggestions
        </button>
        <button
          type="button"
          onClick={async () => {
            setMsg(null);
            const res = await fetch(`/api/broker/listings/${listingId}/marketing-drafts/generate`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ kinds: ["just_listed", "seo_listing_page", "sms_lead_update"] }),
            });
            if (!res.ok) setMsg("Génération indisponible");
            else await refresh();
          }}
          className="rounded-lg border border-amber-900/40 bg-black/50 px-4 py-2 text-xs text-zinc-200 hover:border-amber-700/50"
        >
          Générer brouillons
        </button>
        <a
          href={`${basePath}/growth`}
          className="rounded-lg border border-amber-900/40 px-4 py-2 text-xs text-zinc-400 hover:text-amber-200/90"
        >
          ← Tableau croissance
        </a>
      </div>

      {loading ? <p className="text-xs text-zinc-500">Chargement…</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ListingHealthCard intelligence={intel} />
        <MarketingOpportunityPanel intelligence={intel} />
      </div>

      <MarketingDraftList listingId={listingId} drafts={drafts} onRefresh={refresh} />
    </div>
  );
}
