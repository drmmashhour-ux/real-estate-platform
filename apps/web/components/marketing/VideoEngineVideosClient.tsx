"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { VideoProjectRowVm } from "@/modules/video-engine/video-engine.types";

type Payload = {
  performanceSummary: {
    created: number;
    approved: number;
    published: number;
    impressionsApprox: number;
    clicksApprox: number;
  };
  draftQueue: VideoProjectRowVm[];
  approvedQueue: VideoProjectRowVm[];
  scheduled: VideoProjectRowVm[];
  published: VideoProjectRowVm[];
};

export function VideoEngineVideosClient({
  marketingHubHref,
  initial,
}: {
  marketingHubHref: string;
  initial: Payload;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function action(path: string, body?: object) {
    setBusy(path);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const templateOptions = useMemo(
    () =>
      [
        { value: "listing_spotlight", label: "Listing spotlight (CRM)" },
        { value: "luxury_property_showcase", label: "Luxury property showcase (FSBO)" },
        { value: "bnhub_stay_spotlight", label: "BNHub stay spotlight" },
        { value: "investor_opportunity_brief", label: "Investor opportunity brief" },
        { value: "residence_services_highlight", label: "Residence services highlight" },
        { value: "deal_of_the_day", label: "Deal of the day" },
        { value: "top_5_listings_area", label: "Top 5 listings in area" },
      ] as const,
    [],
  );

  const [templateKey, setTemplateKey] = useState<string>("listing_spotlight");
  const [listingId, setListingId] = useState("");
  const [fsboListingId, setFsboListingId] = useState("");
  const [stayId, setStayId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [residenceId, setResidenceId] = useState("");
  const [city, setCity] = useState("");
  const [duration, setDuration] = useState<15 | 30 | 45>(30);

  async function generate() {
    const base = { templateKey, durationTargetSec: duration };
    let body: Record<string, unknown> = base;
    if (templateKey === "listing_spotlight") body = { ...base, listingId };
    else if (templateKey === "luxury_property_showcase") body = { ...base, fsboListingId };
    else if (templateKey === "bnhub_stay_spotlight") body = { ...base, stayId };
    else if (templateKey === "investor_opportunity_brief") body = { ...base, opportunityId };
    else if (templateKey === "residence_services_highlight") body = { ...base, residenceId };
    else if (templateKey === "top_5_listings_area") body = { ...base, city };

    await action("/api/dashboard/marketing/video-engine/generate", body);
  }

  function CardRow({ row }: { row: VideoProjectRowVm }) {
    return (
      <li className="rounded-xl border border-white/10 bg-zinc-950/50 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-medium text-white">{row.title}</p>
            <p className="text-xs text-zinc-500">{row.templateKey}</p>
            <p className="mt-1 text-xs text-zinc-400">{row.hookText.slice(0, 140)}</p>
          </div>
          <span className="rounded-full border border-amber-700/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200">{row.status}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!busy}
            className="rounded-lg bg-emerald-800/80 px-2 py-1 text-xs text-white hover:bg-emerald-700"
            onClick={() => void action(`/api/dashboard/marketing/video-engine/${row.id}/approve`)}
          >
            Approve
          </button>
          <button
            type="button"
            disabled={!!busy}
            className="rounded-lg bg-red-900/70 px-2 py-1 text-xs text-white hover:bg-red-800"
            onClick={() => void action(`/api/dashboard/marketing/video-engine/${row.id}/reject`, { reason: "Rejected from videos console" })}
          >
            Reject
          </button>
          <button
            type="button"
            disabled={!!busy}
            className="rounded-lg border border-sky-700/60 px-2 py-1 text-xs text-sky-200 hover:bg-sky-950/60"
            onClick={() =>
              void action(`/api/dashboard/marketing/video-engine/${row.id}/schedule`, {
                scheduledAt: new Date(Date.now() + 86400000).toISOString(),
              })
            }
          >
            Schedule +24h
          </button>
          <button
            type="button"
            disabled={!!busy}
            className="rounded-lg border border-amber-700/60 px-2 py-1 text-xs text-amber-100 hover:bg-amber-950/40"
            onClick={() => void action(`/api/dashboard/marketing/video-engine/${row.id}/hub-draft`)}
          >
            Hub draft
          </button>
          <a
            href={`/api/dashboard/marketing/video-engine/${row.id}/manifest`}
            className="rounded-lg border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
            target="_blank"
            rel="noreferrer"
          >
            Manifest JSON
          </a>
          <button
            type="button"
            disabled={!!busy}
            className="rounded-lg border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
            onClick={() => void action(`/api/dashboard/marketing/video-engine/${row.id}/publish`)}
          >
            Mark published
          </button>
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={marketingHubHref} className="text-sm text-sky-300 hover:text-sky-200">
          ← Marketing Hub
        </Link>
      </div>

      <section className="rounded-2xl border border-amber-900/30 bg-black/60 p-6">
        <h2 className="text-lg font-semibold text-white">Performance summary</h2>
        <dl className="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-white/10 px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Projects</dt>
            <dd className="font-mono text-white">{initial.performanceSummary.created}</dd>
          </div>
          <div className="rounded-lg border border-white/10 px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Approved</dt>
            <dd className="font-mono text-white">{initial.performanceSummary.approved}</dd>
          </div>
          <div className="rounded-lg border border-white/10 px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Published</dt>
            <dd className="font-mono text-white">{initial.performanceSummary.published}</dd>
          </div>
          <div className="rounded-lg border border-white/10 px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Impressions (synced)</dt>
            <dd className="font-mono text-white">{initial.performanceSummary.impressionsApprox}</dd>
          </div>
          <div className="rounded-lg border border-white/10 px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Clicks (synced)</dt>
            <dd className="font-mono text-white">{initial.performanceSummary.clicksApprox}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/40 p-6">
        <h2 className="text-lg font-semibold text-white">Generate new video</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Creates script + JSON render manifest + ranked media references. Nothing is posted publicly without approval.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="text-zinc-400">Template</span>
            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
            >
              {templateOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Duration target</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) as 15 | 30 | 45)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={45}>45s</option>
            </select>
          </label>
        </div>

        {templateKey === "listing_spotlight" ? (
          <label className="mt-4 block text-sm">
            <span className="text-zinc-400">CRM listing ID</span>
            <input
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              placeholder="listing cuid"
            />
          </label>
        ) : null}
        {templateKey === "luxury_property_showcase" ? (
          <label className="mt-4 block text-sm">
            <span className="text-zinc-400">FSBO listing ID</span>
            <input
              value={fsboListingId}
              onChange={(e) => setFsboListingId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
            />
          </label>
        ) : null}
        {templateKey === "bnhub_stay_spotlight" ? (
          <label className="mt-4 block text-sm">
            <span className="text-zinc-400">BNHub stay ID</span>
            <input
              value={stayId}
              onChange={(e) => setStayId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
            />
          </label>
        ) : null}
        {templateKey === "investor_opportunity_brief" ? (
          <label className="mt-4 block text-sm">
            <span className="text-zinc-400">Capital deal / opportunity ID</span>
            <input
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
            />
          </label>
        ) : null}
        {templateKey === "residence_services_highlight" ? (
          <label className="mt-4 block text-sm">
            <span className="text-zinc-400">Senior residence ID</span>
            <input
              value={residenceId}
              onChange={(e) => setResidenceId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
            />
          </label>
        ) : null}
        {templateKey === "top_5_listings_area" ? (
          <label className="mt-4 block text-sm">
            <span className="text-zinc-400">City</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              placeholder="Montreal"
            />
          </label>
        ) : null}

        <button
          type="button"
          disabled={!!busy}
          onClick={() => void generate()}
          className="mt-6 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 px-5 py-2.5 text-sm font-medium text-black hover:from-amber-600 hover:to-amber-500"
        >
          {busy ? "…" : "Generate preview package"}
        </button>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Draft / preview queue</h2>
        <ul className="mt-3 space-y-3">
          {initial.draftQueue.length === 0 ? (
            <li className="text-sm text-zinc-500">No drafts.</li>
          ) : (
            initial.draftQueue.map((row) => <CardRow key={row.id} row={row} />)
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Approved (ready to schedule)</h2>
        <ul className="mt-3 space-y-3">
          {initial.approvedQueue.length === 0 ? (
            <li className="text-sm text-zinc-500">None.</li>
          ) : (
            initial.approvedQueue.map((v) => <CardRow key={v.id} v={v} />)
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Scheduled</h2>
        <ul className="mt-3 space-y-3">
          {initial.scheduled.length === 0 ? (
            <li className="text-sm text-zinc-500">Nothing scheduled.</li>
          ) : (
            initial.scheduled.map((v) => <CardRow key={v.id} v={v} />)
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Published</h2>
        <ul className="mt-3 space-y-3">
          {initial.published.length === 0 ? (
            <li className="text-sm text-zinc-500">None yet.</li>
          ) : (
            initial.published.map((row) => <CardRow key={row.id} row={row} />)
          )}
        </ul>
      </section>
    </div>
  );
}
