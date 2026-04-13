"use client";

import { useState } from "react";
import { buildListingShareUrlWithUtm } from "@/lib/content-automation/attribution";

export function ContentAutomationHostPanel({ listingId }: { listingId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(opts: { skipVideo: boolean }) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/bnhub/listings/${encodeURIComponent(listingId)}/content-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run: true,
          skipVideo: opts.skipVideo,
        }),
      });
      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(
        data.jobId
          ? `Job started. Job id ${data.jobId.slice(0, 12)}… — open Admin → Content → Jobs to review.`
          : "Started."
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
      <h2 className="text-sm font-semibold text-emerald-200">Social content (AI)</h2>
      <p className="mt-1 text-xs text-slate-400">
        Generates TikTok/Reels-style scripts and optional vertical video. Nothing is posted to social without admin
        scheduling. Facts come only from your listing.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run({ skipVideo: false })}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Working…" : "Generate content + video"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run({ skipVideo: true })}
          className="rounded-xl border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          Copy only
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          onClick={() => {
            const base =
              typeof window !== "undefined"
                ? window.location.origin
                : (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
            if (!base) {
              setMsg("Set NEXT_PUBLIC_APP_URL for share links.");
              return;
            }
            const url = buildListingShareUrlWithUtm({
              baseUrl: base,
              listingId,
              platform: "tiktok",
            });
            void navigator.clipboard.writeText(url);
            setMsg("Canonical listing link with UTM copied.");
          }}
        >
          Copy share link (UTM)
        </button>
      </div>
      {msg ? <p className="mt-2 text-xs text-slate-400">{msg}</p> : null}
    </div>
  );
}
