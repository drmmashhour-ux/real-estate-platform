"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CampaignListRow } from "../types";
import { m } from "../components/marketing-ui-classes";
import { CampaignStatusBadge } from "../components/CampaignStatusBadge";
import { ScheduleCampaignModal } from "../components/ScheduleCampaignModal";
import type { BnhubMarketingCampaignObjective } from "@prisma/client";

type Overview = {
  listings: { id: string; title: string; city: string | null; listingCode: string | null }[];
  campaigns: CampaignListRow[];
  totalCampaigns: number;
  openRecommendations: number;
};

const OBJECTIVES: BnhubMarketingCampaignObjective[] = [
  "AWARENESS",
  "TRAFFIC",
  "LEAD_GENERATION",
  "BOOKING_CONVERSION",
  "BRAND_BUILDING",
];

export function HostMarketingDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [listingId, setListingId] = useState("");
  const [name, setName] = useState("");
  const [objective, setObjective] = useState<BnhubMarketingCampaignObjective>("BOOKING_CONVERSION");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setErr(null);
    const r = await fetch("/api/bnhub/host/marketing/overview");
    if (r.status === 401) {
      window.location.href = "/bnhub/login";
      return;
    }
    const j = (await r.json()) as Overview & { error?: string };
    if (!r.ok) {
      setErr(j.error ?? "Failed");
      return;
    }
    setData(j);
    if (j.listings[0] && !listingId) setListingId(j.listings[0].id);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!listingId) return;
    setSaving(true);
    try {
      const r = await fetch("/api/bnhub/host/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          campaignName: name || "My promotion",
          objective,
        }),
      });
      const j = (await r.json()) as { id?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setOpen(false);
      setName("");
      await load();
      if (j.id) window.location.href = `/bnhub/host/marketing/campaigns/${j.id}`;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing & promotion</h1>
          <p className={m.subtitle}>AI content packs, internal placement, exports — your listings only.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/bnhub/host/dashboard" className={m.btnGhost}>
            Host home
          </Link>
          <button type="button" className={m.btnPrimary} onClick={() => setOpen(true)}>
            New campaign
          </button>
        </div>
      </div>

      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      {!data ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-800/80" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={m.cardMuted}>
              <p className="text-xs uppercase text-zinc-500">Your campaigns</p>
              <p className="text-2xl font-bold text-amber-400">{data.totalCampaigns}</p>
            </div>
            <div className={m.cardMuted}>
              <p className="text-xs uppercase text-zinc-500">Open recommendations</p>
              <p className="text-2xl font-bold text-white">{data.openRecommendations}</p>
            </div>
            <div className={m.cardMuted}>
              <p className="text-xs uppercase text-zinc-500">Listings</p>
              <p className="text-2xl font-bold text-white">{data.listings.length}</p>
            </div>
          </div>

          <div className={m.card}>
            <h2 className={m.title}>Promotion readiness</h2>
            <p className="mb-4 text-sm text-zinc-400">Open a listing to see readiness, AI pack, and exports.</p>
            <ul className="divide-y divide-zinc-800/80">
              {data.listings.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-white">{l.title}</p>
                    <p className="text-xs text-zinc-500">
                      {l.city ?? "—"} · {l.listingCode}
                    </p>
                  </div>
                  <Link href={`/bnhub/host/marketing/listings/${l.id}`} className={m.btnGhost}>
                    Open
                  </Link>
                </li>
              ))}
            </ul>
            {data.listings.length === 0 ? (
              <p className="text-sm text-zinc-500">No listings — create a BNHub listing first.</p>
            ) : null}
          </div>

          <div className={m.card}>
            <h2 className={m.title}>Recent campaigns</h2>
            <ul className="divide-y divide-zinc-800/80">
              {data.campaigns.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <Link href={`/bnhub/host/marketing/campaigns/${c.id}`} className="font-medium text-amber-400 hover:text-amber-300">
                      {c.campaignName}
                    </Link>
                    <p className="text-xs text-zinc-500">{c.listing.title}</p>
                  </div>
                  <CampaignStatusBadge status={c.status} />
                </li>
              ))}
            </ul>
            {data.campaigns.length === 0 ? (
              <p className="text-sm text-zinc-500">No campaigns yet — launch one above.</p>
            ) : null}
          </div>
        </>
      )}

      <ScheduleCampaignModal
        open={open}
        title="Create campaign"
        onClose={() => setOpen(false)}
        onConfirm={create}
        busy={saving}
        confirmLabel="Create"
      >
        <div className="space-y-3">
          <div>
            <label className={m.label}>Listing</label>
            <select className={m.input} value={listingId} onChange={(e) => setListingId(e.target.value)}>
              {(data?.listings ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={m.label}>Campaign name</label>
            <input className={m.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className={m.label}>Objective</label>
            <select
              className={m.input}
              value={objective}
              onChange={(e) => setObjective(e.target.value as BnhubMarketingCampaignObjective)}
            >
              {OBJECTIVES.map((o) => (
                <option key={o} value={o}>
                  {o.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ScheduleCampaignModal>
    </div>
  );
}
