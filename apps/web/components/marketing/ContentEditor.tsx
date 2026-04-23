"use client";

import { useState } from "react";

import type { ContentItem } from "@/modules/marketing-content/content-calendar.types";
import {
  advanceStatus,
  createContentItem,
  generateCaptionSuggestion,
  suggestContentIdeas,
  updateContentItem,
} from "@/modules/marketing-content/content-calendar.service";
import { updatePerformance } from "@/modules/marketing-content/content-performance.service";

const TYPES = ["VIDEO", "POSTER", "TEXT"] as const;
const PLATFORMS = ["TIKTOK", "INSTAGRAM", "YOUTUBE", "LINKEDIN"] as const;
const AUDIENCES = ["BROKER", "INVESTOR", "BUYER", "GENERAL"] as const;
const GOALS = ["LEADS", "AWARENESS", "CONVERSION"] as const;
const STATUSES = ["IDEA", "SCRIPT", "READY", "SCHEDULED", "POSTED"] as const;

type Props = {
  item: ContentItem | null;
  onClose: () => void;
  onSaved: () => void;
  defaultDate?: string;
};

export function ContentEditor({ item, onClose, onSaved, defaultDate }: Props) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [type, setType] = useState(item?.type ?? "VIDEO");
  const [platform, setPlatform] = useState(item?.platform ?? "INSTAGRAM");
  const [hook, setHook] = useState(item?.hook ?? "");
  const [script, setScript] = useState(item?.script ?? "");
  const [caption, setCaption] = useState(item?.caption ?? "");
  const [audience, setAudience] = useState(item?.audience ?? "GENERAL");
  const [goal, setGoal] = useState(item?.goal ?? "AWARENESS");
  const [status, setStatus] = useState(item?.status ?? "IDEA");
  const [scheduledDate, setScheduledDate] = useState(
    item?.scheduledDate ?? defaultDate ?? ""
  );
  const [assetUrl, setAssetUrl] = useState(item?.assetUrl ?? "");
  const [views, setViews] = useState(String(item?.performance.views ?? 0));
  const [clicks, setClicks] = useState(String(item?.performance.clicks ?? 0));
  const [leads, setLeads] = useState(String(item?.performance.leads ?? 0));
  const [revenueDollars, setRevenueDollars] = useState(
    String((item?.performance.revenueCents ?? 0) / 100)
  );

  function persist() {
    if (!title.trim()) return;
    const perf = {
      views: Math.max(0, Number(views) || 0),
      clicks: Math.max(0, Number(clicks) || 0),
      leads: Math.max(0, Number(leads) || 0),
      revenueCents: Math.round((Number(revenueDollars) || 0) * 100),
    };
    if (item) {
      const updated = updateContentItem(item.id, {
        title: title.trim(),
        type,
        platform,
        hook,
        script,
        caption,
        audience,
        goal,
        status,
        scheduledDate: scheduledDate || undefined,
        assetUrl: assetUrl || undefined,
        performance: perf,
      });
      if (!updated) {
        window.alert(
          "Could not save this status change. Use “Advance status →” for workflow steps (IDEA → … → POSTED), or schedule with a date."
        );
        return;
      }
    } else {
      const created = createContentItem({
        title: title.trim(),
        type,
        platform,
        hook,
        script,
        caption,
        audience,
        goal,
        status,
        scheduledDate: scheduledDate || undefined,
        assetUrl: assetUrl || undefined,
      });
      if (perf.views || perf.clicks || perf.leads || perf.revenueCents) {
        updatePerformance(created.id, perf);
      }
    }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">
            {item ? "Edit content" : "New content"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/20 px-2 py-1 text-sm text-zinc-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <label className="block space-y-1">
            <span className="text-zinc-400">Title</span>
            <input
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reel title or internal name"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-zinc-400">Type</span>
              <select
                className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-white"
                value={type}
                onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-zinc-400">Platform</span>
              <select
                className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-white"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as (typeof PLATFORMS)[number])}
              >
                {PLATFORMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-zinc-400">Hook</span>
            <input
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-400">Script</span>
            <textarea
              className="min-h-[88px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
              value={script}
              onChange={(e) => setScript(e.target.value)}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-400">Caption</span>
            <textarea
              className="min-h-[72px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-amber-600/40 bg-amber-950/30 px-3 py-1.5 text-amber-100 hover:bg-amber-950/50"
              onClick={() =>
                setCaption(
                  generateCaptionSuggestion({ hook, audience, title: title || undefined })
                )
              }
            >
              Generate caption (AI-lite)
            </button>
            <button
              type="button"
              className="rounded-lg border border-sky-600/40 bg-sky-950/30 px-3 py-1.5 text-sky-200 hover:bg-sky-950/50"
              onClick={() => {
                const ideas = suggestContentIdeas(audience, 1)[0];
                if (ideas) {
                  setHook(ideas.hook);
                  setScript((s) => (s.trim() ? s : ideas.scriptOutline));
                }
              }}
            >
              Suggest hook & outline
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-zinc-400">Audience</span>
              <select
                className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-white"
                value={audience}
                onChange={(e) => setAudience(e.target.value as (typeof AUDIENCES)[number])}
              >
                {AUDIENCES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-zinc-400">Goal</span>
              <select
                className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-white"
                value={goal}
                onChange={(e) => setGoal(e.target.value as (typeof GOALS)[number])}
              >
                {GOALS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-zinc-400">Status</span>
            <select
              className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-white"
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
            >
              {STATUSES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-400">Scheduled day (YYYY-MM-DD)</span>
            <input
              type="date"
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
              value={scheduledDate ? scheduledDate.slice(0, 10) : ""}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-400">Asset URL (video / poster)</span>
            <input
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
              value={assetUrl}
              onChange={(e) => setAssetUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>

          {item ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 font-medium text-zinc-300">Performance (attribution)</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-xs text-zinc-500">Views</span>
                  <input
                    className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
                    value={views}
                    onChange={(e) => setViews(e.target.value)}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-zinc-500">Clicks</span>
                  <input
                    className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
                    value={clicks}
                    onChange={(e) => setClicks(e.target.value)}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-zinc-500">Leads</span>
                  <input
                    className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
                    value={leads}
                    onChange={(e) => setLeads(e.target.value)}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-zinc-500">Revenue (CAD)</span>
                  <input
                    className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
                    value={revenueDollars}
                    onChange={(e) => setRevenueDollars(e.target.value)}
                  />
                </label>
              </div>
              <button
                type="button"
                className="mt-2 rounded-lg border border-emerald-600/40 px-3 py-1 text-emerald-200 hover:bg-emerald-950/40"
                onClick={() => {
                  if (!item) return;
                  updatePerformance(item.id, {
                    views: Math.max(0, Number(views) || 0),
                    clicks: Math.max(0, Number(clicks) || 0),
                    leads: Math.max(0, Number(leads) || 0),
                    revenueCents: Math.round((Number(revenueDollars) || 0) * 100),
                  });
                  onSaved();
                }}
              >
                Save metrics only
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={persist}
              className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-black hover:bg-amber-500"
            >
              Save
            </button>
            {item ? (
              <button
                type="button"
                onClick={() => {
                  const next = advanceStatus(item);
                  if (next) onSaved();
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-white hover:bg-white/10"
              >
                Advance status →
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
