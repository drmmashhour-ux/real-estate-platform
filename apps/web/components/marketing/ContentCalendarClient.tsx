"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  format,
  getISODay,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";

import type {
  CalendarViewMode,
  ContentAudience,
  ContentItem,
  ContentPlatform,
} from "@/modules/marketing-content/content-calendar.types";
import { loadMarketingContentStore } from "@/modules/marketing-content/content-calendar-storage";
import {
  filterItems,
  getNotifications,
  itemsForDay,
  listContentItems,
  refreshNotifications,
  rescheduleContent,
  weekDaysContaining,
} from "@/modules/marketing-content/content-calendar.service";
import { buildMarketingContentDashboardSummary } from "@/modules/marketing-content/content-performance.service";

import { ContentEditor } from "./ContentEditor";

type Props = { marketingHubHref: string };

export function ContentCalendarClient({ marketingHubHref }: Props) {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((x) => x + 1);

  useEffect(() => {
    refreshNotifications();
    refresh();
  }, []);

  useEffect(() => {
    const store = loadMarketingContentStore();
    const timer = window.setTimeout(() => {
      fetch("/api/dashboard/marketing/content-calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(store),
      }).catch(() => {});
    }, 600);
    return () => window.clearTimeout(timer);
  }, [tick]);

  const items = useMemo(() => listContentItems(), [tick]);

  const [view, setView] = useState<CalendarViewMode>("weekly");
  const [anchor, setAnchor] = useState(() => new Date());
  const [platform, setPlatform] = useState<ContentPlatform | "ALL">("ALL");
  const [audience, setAudience] = useState<ContentAudience | "ALL">("ALL");
  const [editorItem, setEditorItem] = useState<ContentItem | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () => filterItems(items, { platform, audience }),
    [items, platform, audience]
  );

  const summary = useMemo(() => buildMarketingContentDashboardSummary(), [tick]);
  const notifications = useMemo(() => getNotifications(), [tick]);

  const anchorDayIso = format(anchor, "yyyy-MM-dd");
  const weekDays = weekDaysContaining(anchor);

  const monthGrid = useMemo(() => {
    const start = startOfMonth(anchor);
    const end = endOfMonth(anchor);
    const days = eachDayOfInterval({ start, end });
    const firstDay = getISODay(start); // 1 (Mon) to 7 (Sun)
    const pads = firstDay - 1;
    const grid: ({ kind: "pad" } | { kind: "day"; iso: string })[] = [];
    for (let i = 0; i < pads; i++) grid.push({ kind: "pad" });
    for (const d of days) grid.push({ kind: "day", iso: format(d, "yyyy-MM-dd") });
    return grid;
  }, [anchor]);

  function navigate(dir: -1 | 1) {
    if (view === "daily") setAnchor((d) => (dir < 0 ? subDays(d, 1) : addDays(d, 1)));
    else if (view === "weekly") setAnchor((d) => (dir < 0 ? subWeeks(d, 1) : addWeeks(d, 1)));
    else setAnchor((d) => (dir < 0 ? subMonths(d, 1) : addMonths(d, 1)));
  }

  function onDrop(dayStr: string, ev: React.DragEvent) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text/plain");
    if (!id) return;
    rescheduleContent(id, dayStr);
    refresh();
  }

  const dayItems = itemsForDay(anchorDayIso, filtered);
  const revenueDisplay = (summary.revenueFromContentCents / 100).toFixed(0);

  if (!items.length && !creating) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
        <h2 className="text-xl font-semibold text-white">No content scheduled</h2>
        <p className="mt-2 text-zinc-500">
          Start by creating your first content idea or planning a post.
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mt-6 rounded-xl bg-amber-600 px-6 py-2.5 font-medium text-black hover:bg-amber-500"
        >
          Create first post
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={marketingHubHref}
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            ← Marketing Hub
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Content Calendar</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            Plan social and growth content, drag items between days, and record performance so you
            can tie posts to leads and revenue.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditorItem(null);
            setCreating(true);
          }}
          className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/25"
        >
          New post
        </button>
      </div>

      <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Today</p>
          <p className="text-2xl font-semibold text-white">{summary.postsToday}</p>
          <p className="text-xs text-zinc-500">scheduled or posted</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">This week</p>
          <p className="text-2xl font-semibold text-white">{summary.postsThisWeek}</p>
          <p className="text-xs text-zinc-500">with a date in range</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Leads (attrib.)</p>
          <p className="text-2xl font-semibold text-emerald-300">{summary.leadsFromContent}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Revenue (attrib.)</p>
          <p className="text-2xl font-semibold text-amber-200">${revenueDisplay}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Best posted</p>
          {summary.bestPerforming ? (
            <button
              type="button"
              onClick={() => setEditorItem(summary.bestPerforming!)}
              className="mt-1 text-left text-sm font-medium text-sky-200 hover:underline"
            >
              {summary.bestPerforming.title}
            </button>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">—</p>
          )}
        </div>
      </section>

      {notifications.length ? (
        <section className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
          <h2 className="text-sm font-semibold text-amber-100">Notifications</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {notifications.slice(0, 6).map((n) => (
              <li key={n.id} className="flex flex-wrap gap-2 text-zinc-300">
                <span className="rounded bg-white/10 px-2 py-0.5 text-xs uppercase text-zinc-400">
                  {n.kind.replace(/_/g, " ")}
                </span>
                <span className="font-medium text-white">{n.title}</span>
                <span className="text-zinc-500">{n.body}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-white/10 bg-black/30 p-1">
          {(
            [
              ["daily", "Daily"],
              ["weekly", "Weekly"],
              ["monthly", "Monthly"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setView(k)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                view === k ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/10"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={() => navigate(1)}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/10"
        >
          Next →
        </button>
        <span className="text-sm text-zinc-500">
          {view === "daily" && format(anchor, "MMMM d, yyyy")}
          {view === "weekly" && `Week of ${format(parseISO(weekDays[0]! + "T12:00:00"), "MMM d")}`}
          {view === "monthly" && format(anchor, "MMMM yyyy")}
        </span>

        <label className="ml-auto flex items-center gap-2 text-sm text-zinc-400">
          Platform
          <select
            className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-white"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as ContentPlatform | "ALL")}
          >
            <option value="ALL">All</option>
            <option value="TIKTOK">TikTok</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="LINKEDIN">LinkedIn</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Audience
          <select
            className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-white"
            value={audience}
            onChange={(e) => setAudience(e.target.value as ContentAudience | "ALL")}
          >
            <option value="ALL">All</option>
            <option value="BROKER">Broker</option>
            <option value="INVESTOR">Investor</option>
            <option value="BUYER">Buyer</option>
            <option value="GENERAL">General</option>
          </select>
        </label>
      </div>

      {view === "daily" ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {format(anchor, "EEEE, MMMM d")}
          </h2>
          <div
            className="min-h-[200px] rounded-xl border border-dashed border-white/10 p-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(anchorDayIso, e)}
          >
            {dayItems.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nothing scheduled — create a post or drag an idea here.
              </p>
            ) : (
              <ul className="space-y-2">
                {dayItems.map((it) => (
                  <li key={it.id}>
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", it.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => setEditorItem(it)}
                      className="flex w-full flex-col rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:border-amber-500/40"
                    >
                      <span className="text-xs text-zinc-500">
                        {it.platform} · {it.type} · {it.status}
                      </span>
                      <span className="font-medium text-white">{it.title}</span>
                      {it.hook ? (
                        <span className="mt-1 line-clamp-2 text-sm text-zinc-400">{it.hook}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {view === "weekly" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
          {weekDays.map((d) => (
            <div key={d}>
              <DayCell
                dayStr={d}
                onDrop={onDrop}
                onEdit={setEditorItem}
                filtered={filtered}
              />
            </div>
          ))}
        </div>
      ) : null}

      {view === "monthly" ? (
        <div className="grid grid-cols-7 gap-2 text-xs text-zinc-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
            <div key={w} className="py-2 text-center font-medium">
              {w}
            </div>
          ))}
          {monthGrid.map((cell, idx) =>
            cell.kind === "pad" ? (
              <div key={`pad-${idx}`} />
            ) : (
              <div key={cell.iso} className="min-h-[88px]">
                <DayCell
                  dayStr={cell.iso}
                  compact
                  onDrop={onDrop}
                  onEdit={setEditorItem}
                  filtered={filtered}
                />
              </div>
            )
          )}
        </div>
      ) : null}

      {(creating || editorItem) && (
        <ContentEditor
          item={creating ? null : editorItem}
          defaultDate={anchorDayIso}
          onClose={() => {
            setCreating(false);
            setEditorItem(null);
          }}
          onSaved={() => {
            refreshNotifications();
            refresh();
            setCreating(false);
            setEditorItem(null);
          }}
        />
      )}
    </div>
  );
}

function DayCell({
  dayStr,
  compact,
  filtered,
  onDrop,
  onEdit,
}: {
  dayStr: string;
  compact?: boolean;
  filtered: ContentItem[];
  onDrop: (day: string, ev: React.DragEvent) => void;
  onEdit: (item: ContentItem) => void;
}) {
  const dayItems = itemsForDay(dayStr, filtered);
  const label = format(parseISO(dayStr + "T12:00:00"), compact ? "d" : "EEE d");

  return (
    <div
      className={`flex flex-col rounded-xl border border-dashed border-white/15 bg-black/25 p-2 ${
        compact ? "min-h-[80px]" : "min-h-[120px]"
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(dayStr, e)}
    >
      <div className="text-[11px] font-medium text-zinc-500">{label}</div>
      <div className="mt-1 flex-1 space-y-1 overflow-hidden">
        {dayItems.map((it) => (
          <button
            key={it.id}
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", it.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => onEdit(it)}
            className="block w-full truncate rounded-lg border border-amber-600/25 bg-amber-950/30 px-2 py-1 text-left text-[11px] text-amber-100 hover:border-amber-400"
          >
            <span className="opacity-60">{it.platform}</span> {it.title}
          </button>
        ))}
      </div>
    </div>
  );
}
