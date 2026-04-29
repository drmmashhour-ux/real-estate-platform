"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BnhubMarketingCampaignObjective, BnhubMarketingCampaignStatus } from "@/types/bnhub-client-models";
import type { CampaignListRow } from "../types";
import { m } from "../components/marketing-ui-classes";
import { CampaignStatusBadge } from "../components/CampaignStatusBadge";
import { ScheduleCampaignModal } from "../components/ScheduleCampaignModal";

const OBJECTIVES: BnhubMarketingCampaignObjective[] = [
  "AWARENESS",
  "TRAFFIC",
  "LEAD_GENERATION",
  "BOOKING_CONVERSION",
  "BRAND_BUILDING",
];

const STATUSES: (BnhubMarketingCampaignStatus | "")[] = [
  "",
  "DRAFT",
  "READY",
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
  "FAILED",
];

type ListingOpt = { id: string; title: string; city: string | null; listingCode: string | null; ownerId: string };

export function AdminMarketingCampaigns() {
  const [rows, setRows] = useState<CampaignListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<BnhubMarketingCampaignStatus | "">("");
  const [hostUserId, setHostUserId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [listingQuery, setListingQuery] = useState("");
  const [listingOpts, setListingOpts] = useState<ListingOpt[]>([]);
  const [pick, setPick] = useState<ListingOpt | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [objective, setObjective] = useState<BnhubMarketingCampaignObjective>("BOOKING_CONVERSION");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const q = new URLSearchParams();
      q.set("take", "60");
      if (status) q.set("status", status);
      if (hostUserId.trim()) q.set("hostUserId", hostUserId.trim());
      const r = await fetch(`/api/admin/bnhub-marketing/campaigns?${q}`);
      const j = (await r.json()) as { campaigns: CampaignListRow[]; total: number; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setRows(j.campaigns);
      setTotal(j.total);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [status, hostUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/admin/bnhub-marketing/listing-options?q=${encodeURIComponent(listingQuery)}`
        );
        const j = (await r.json()) as { listings: ListingOpt[] };
        if (r.ok) setListingOpts(j.listings);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [listingQuery]);

  const create = async () => {
    if (!pick) throw new Error("Select a listing");
    setSaving(true);
    try {
      const r = await fetch("/api/admin/bnhub-marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: pick.id,
          hostUserId: pick.ownerId,
          campaignName: campaignName || `Campaign — ${pick.title}`,
          objective,
        }),
      });
      const j = (await r.json()) as { id?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setCreateOpen(false);
      setPick(null);
      setCampaignName("");
      await load();
      if (j.id) window.location.href = `/admin/bnhub/marketing/campaigns/${j.id}`;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className={m.subtitle}>{total} total · filters apply server-side</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/bnhub/marketing" className={m.btnGhost}>
            ← Dashboard
          </Link>
          <button type="button" className={m.btnPrimary} onClick={() => setCreateOpen(true)}>
            New campaign
          </button>
        </div>
      </div>

      <div className={`${m.cardMuted} flex flex-wrap gap-3`}>
        <div>
          <label className={m.label}>Status</label>
          <select
            className={m.input}
            value={status}
            onChange={(e) => setStatus(e.target.value as BnhubMarketingCampaignStatus | "")}
          >
            {STATUSES.map((s) => (
              <option key={s || "all"} value={s}>
                {s || "All"}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-1">
          <label className={m.label}>Host user id</label>
          <input
            className={m.input}
            placeholder="Filter by host UUID"
            value={hostUserId}
            onChange={(e) => setHostUserId(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button type="button" className={m.btnGhost} onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
              <th className="p-3">Campaign</th>
              <th className="p-3">Listing</th>
              <th className="p-3">City</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">
                  Loading…
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                  <td className="p-3 font-medium text-white">{c.campaignName}</td>
                  <td className="p-3 text-zinc-300">{c.listing.title}</td>
                  <td className="p-3 text-zinc-400">{c.listing.city ?? "—"}</td>
                  <td className="p-3">
                    <CampaignStatusBadge status={c.status} />
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/bnhub/marketing/campaigns/${c.id}`} className="text-amber-400 hover:text-amber-300">
                      Open
                    </Link>
                    {" · "}
                    <Link
                      href={`/admin/bnhub/marketing/listings/${c.listingId}`}
                      className="text-zinc-400 hover:text-white"
                    >
                      Listing
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && rows.length === 0 ? (
          <p className="p-8 text-center text-zinc-500">No campaigns match filters.</p>
        ) : null}
      </div>

      <ScheduleCampaignModal
        open={createOpen}
        title="Create campaign"
        onClose={() => setCreateOpen(false)}
        onConfirm={create}
        confirmLabel="Create"
        busy={saving}
      >
        <div className="space-y-3">
          <div>
            <label className={m.label}>Search listing</label>
            <input
              className={m.input}
              value={listingQuery}
              onChange={(e) => setListingQuery(e.target.value)}
              placeholder="Title, city, code…"
            />
            <ul className="mt-2 max-h-40 overflow-auto rounded-lg border border-zinc-800">
              {listingOpts.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 ${
                      pick?.id === l.id ? "bg-amber-950/40 text-amber-200" : "text-zinc-300"
                    }`}
                    onClick={() => setPick(l)}
                  >
                    {l.title} · {l.city ?? "—"} <span className="text-zinc-500">({l.listingCode})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className={m.label}>Campaign name</label>
            <input
              className={m.input}
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Optional — defaults from listing"
            />
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
          {!pick ? <p className="text-xs text-amber-500/90">Select a listing to enable create.</p> : null}
        </div>
      </ScheduleCampaignModal>
    </div>
  );
}
