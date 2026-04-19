"use client";

import * as React from "react";
import type { InvestorShareLink, InvestorShareVisibility } from "@/modules/investors/investor-share.types";

const defaultVisibility: InvestorShareVisibility = {
  metrics: true,
  narrative: true,
  executionProof: true,
  expansionStory: true,
  risks: true,
  outlook: true,
};

export function InvestorSharePanel() {
  const [links, setLinks] = React.useState<InvestorShareLink[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const [label, setLabel] = React.useState("");
  const [publicTitle, setPublicTitle] = React.useState("Platform snapshot");
  const [publicSubtitle, setPublicSubtitle] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [windowDays, setWindowDays] = React.useState(14);
  const [visibility, setVisibility] = React.useState<InvestorShareVisibility>(defaultVisibility);

  const load = React.useCallback(() => {
    void fetch("/api/investors/share", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { links?: InvestorShareLink[]; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed to load share links");
        setLinks(j.links ?? []);
        setErr(null);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const copyLink = React.useCallback((token: string, id: string) => {
    const url = `${window.location.origin}/investor/share/${encodeURIComponent(token)}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const create = React.useCallback(() => {
    setBusy(true);
    void fetch("/api/investors/share", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label || undefined,
        publicTitle,
        publicSubtitle: publicSubtitle || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        windowDays,
        visibility,
      }),
    })
      .then(async (r) => {
        const j = (await r.json()) as { link?: InvestorShareLink; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Create failed");
        load();
        if (j.link) copyLink(j.link.token, j.link.id);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"))
      .finally(() => setBusy(false));
  }, [label, publicTitle, publicSubtitle, expiresAt, windowDays, visibility, load, copyLink]);

  const revoke = React.useCallback(
    (id: string) => {
      setBusy(true);
      void fetch("/api/investors/share/revoke", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
        .then(async (r) => {
          const j = (await r.json()) as { ok?: boolean; error?: string };
          if (!r.ok) throw new Error(j.error ?? "Revoke failed");
          load();
        })
        .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"))
        .finally(() => setBusy(false));
    },
    [load],
  );

  const toggle = (key: keyof InvestorShareVisibility) => {
    setVisibility((v) => ({ ...v, [key]: !v[key] }));
  };

  if (err) {
    return (
      <div className="rounded-xl border border-amber-900/45 bg-amber-950/15 p-4 text-sm text-amber-100/90">
        <p className="font-medium">Share links</p>
        <p className="mt-2 text-amber-200/80">{err}</p>
      </div>
    );
  }

  if (!links) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 text-xs text-zinc-500">Loading share links…</div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-4">
      <h4 className="text-sm font-semibold text-indigo-200/90">Investor share link</h4>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
        Read-only public snapshot. Revoke anytime. Links do not expose admin tools or raw internal data.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-[11px] text-zinc-400">
          Public title
          <input
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            value={publicTitle}
            onChange={(e) => setPublicTitle(e.target.value)}
            maxLength={200}
          />
        </label>
        <label className="block text-[11px] text-zinc-400">
          Label (internal)
          <input
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={120}
            placeholder="Q1 external"
          />
        </label>
        <label className="block text-[11px] text-zinc-400 sm:col-span-2">
          Public subtitle (optional)
          <input
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            value={publicSubtitle}
            onChange={(e) => setPublicSubtitle(e.target.value)}
            maxLength={300}
          />
        </label>
        <label className="block text-[11px] text-zinc-400">
          Expires (optional, local time)
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </label>
        <label className="block text-[11px] text-zinc-400">
          Window (days)
          <input
            type="number"
            min={7}
            max={45}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-[11px] font-medium text-zinc-500">Sections</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ["metrics", "Metrics"],
              ["narrative", "Narrative"],
              ["executionProof", "Proof points"],
              ["expansionStory", "Expansion"],
              ["risks", "Risks"],
              ["outlook", "Outlook"],
            ] as const
          ).map(([key, lab]) => (
            <label key={key} className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={visibility[key]}
                onChange={() => toggle(key)}
                className="rounded border-zinc-600"
              />
              {lab}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        disabled={busy}
        className="mt-4 rounded-md border border-indigo-600 bg-indigo-900/40 px-3 py-1.5 text-xs font-medium text-indigo-100 hover:bg-indigo-800/50 disabled:opacity-50"
        onClick={() => create()}
      >
        Create link &amp; copy URL
      </button>

      <div className="mt-6 border-t border-zinc-800 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Active &amp; past links</p>
        {links.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-600">No links yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {links.map((l) => (
              <li key={l.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-zinc-200">{l.label || l.publicTitle}</span>
                  <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] uppercase text-zinc-400">{l.status}</span>
                </div>
                <p className="mt-1 text-[10px] text-zinc-500">
                  Created {new Date(l.createdAt).toLocaleString()}
                  {l.expiresAt ? ` · Expires ${new Date(l.expiresAt).toLocaleString()}` : ""}
                  {l.lastViewedAt ? ` · Last view ${new Date(l.lastViewedAt).toLocaleString()}` : ""}
                  {` · Views ${l.viewCount}`}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {l.status === "active" && !isLinkExpiredDisplay(l) ? (
                    <>
                      <button
                        type="button"
                        className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-900"
                        onClick={() => copyLink(l.token, l.id)}
                      >
                        {copiedId === l.id ? "Copied" : "Copy URL"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded border border-rose-900/50 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-950/40 disabled:opacity-50"
                        onClick={() => revoke(l.id)}
                      >
                        Revoke
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-zinc-600">No actions</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="button" className="mt-3 text-[11px] text-indigo-400 hover:underline" onClick={() => load()}>
        Refresh list
      </button>
    </div>
  );
}

function isLinkExpiredDisplay(l: InvestorShareLink): boolean {
  if (!l.expiresAt || l.status !== "active") return false;
  return new Date(l.expiresAt) <= new Date();
}
