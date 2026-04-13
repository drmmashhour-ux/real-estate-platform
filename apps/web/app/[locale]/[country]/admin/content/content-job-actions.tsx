"use client";

import { useState } from "react";

const platformLabel: Record<string, string> = {
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "PUBLISHED"
      ? "bg-emerald-950/60 text-emerald-200 border-emerald-800/60"
      : status === "SCHEDULED"
        ? "bg-sky-950/60 text-sky-200 border-sky-800/60"
        : status === "FAILED"
          ? "bg-red-950/60 text-red-200 border-red-800/60"
          : "bg-zinc-800 text-zinc-300 border-zinc-700";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide border ${cls}`}>
      {status.toLowerCase()}
    </span>
  );
}

export function ContentJobActions({
  jobId,
  formattedCaption,
  mediaUrl,
  socialPosts,
}: {
  jobId: string;
  formattedCaption: string;
  mediaUrl: string | null;
  socialPosts: { id: string; platform: string; status: string; publishMode: string; externalPostId: string | null }[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function retry(skipVideo: boolean) {
    setBusy("retry");
    setMsg(null);
    try {
      const res = await fetch("/api/content-automation/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, skipVideo }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg("Pipeline re-ran. Refresh the page.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function publishNow(platform: "tiktok" | "instagram" | "facebook") {
    setBusy(`pub-${platform}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/content/${jobId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, mode: "direct" }),
      });
      const data = (await res.json()) as { error?: string; detail?: unknown };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg("Publish completed. Refresh to see status.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function scheduleExternal() {
    setBusy("sched-ext");
    setMsg(null);
    try {
      const res = await fetch(`/api/content/${jobId}/schedule-external`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: new Date(Date.now() + 7200_000).toISOString(),
        }),
      });
      const data = (await res.json()) as { error?: string; warning?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(data.warning ? `Partial: ${data.warning}` : "External schedule OK. Refresh.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function copyManual() {
    try {
      await navigator.clipboard.writeText(formattedCaption);
      setMsg("Caption copied. For TikTok: open the app → upload video → paste caption in description.");
    } catch {
      setMsg("Could not copy — select caption manually.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {socialPosts.length > 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Recent posts</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {socialPosts.slice(0, 8).map((p) => (
              <li
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900/50 px-2 py-1 text-xs text-zinc-300"
              >
                <span title={p.platform}>{platformLabel[p.platform] ?? p.platform}</span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void retry(false)}
          className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {busy === "retry" ? "Running…" : "Regenerate (copy + video)"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void retry(true)}
          className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          Regenerate copy only
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Publish now</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void publishNow("instagram")}
            className="rounded-lg border border-purple-500/40 px-3 py-2 text-sm text-purple-200 hover:bg-purple-950/40 disabled:opacity-50"
          >
            {busy === "pub-instagram" ? "…" : "Instagram"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void publishNow("facebook")}
            className="rounded-lg border border-blue-500/40 px-3 py-2 text-sm text-blue-200 hover:bg-blue-950/40 disabled:opacity-50"
          >
            {busy === "pub-facebook" ? "…" : "Facebook Page"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void publishNow("tiktok")}
            className="rounded-lg border border-pink-500/40 px-3 py-2 text-sm text-pink-200 hover:bg-pink-950/40 disabled:opacity-50"
          >
            {busy === "pub-tiktok" ? "…" : "TikTok (scheduler)"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void scheduleExternal()}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy === "sched-ext" ? "Scheduling…" : "Schedule externally (Buffer / Metricool)"}
        </button>
        <button
          type="button"
          onClick={() => void copyManual()}
          className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Copy for manual posting
        </button>
        {mediaUrl ? (
          <a
            href={mediaUrl}
            download
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Open / download media
          </a>
        ) : null}
      </div>

      <p className="text-xs text-zinc-600">
        TikTok has no unattended Graph publish in this flow — we use Buffer/Metricool or manual copy. Instagram uses Meta
        Content Publishing when connected under Admin → Social.
      </p>

      {msg ? <p className="text-sm text-zinc-400">{msg}</p> : null}
    </div>
  );
}
