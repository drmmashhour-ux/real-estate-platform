"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { FabricObject } from "fabric";
import {
  generateStudioMarketingCopy,
  MARKETING_TEMPLATE_LABELS,
  triggerDownloadDataUrl,
  type ExportFormat,
  type MarketingTemplateId,
  type StudioAudience,
} from "@/modules/marketing-studio";
import type { EditorCanvasHandle } from "./EditorCanvas";

const EditorCanvas = dynamic(
  () => import("./EditorCanvas").then((m) => m.EditorCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 text-sm text-zinc-400">
        Loading editor…
      </div>
    ),
  }
);

export type MarketingListingOption = { id: string; title: string; city: string | null };

type Props = {
  /** Reserved for deep links / i18n in a later iteration */
  locale: string;
  country: string;
  listings: MarketingListingOption[];
  /** Server-passed feature gates (Marketing System v2) */
  blogSystemV1?: boolean;
  distributionV1?: boolean;
  /** When true, show listing-attributed ROI/impressions from Marketing Intelligence (real events). */
  marketingIntelligenceV1?: boolean;
  /** Soft launch + ads drafts + first-100 playbook (separate flags). */
  softLaunchV1?: boolean;
  adsEngineV1?: boolean;
  firstUsersV1?: boolean;
};

const FONTS = ["Inter, system-ui, sans-serif", "Georgia, serif", "ui-monospace, monospace"];

export function MarketingStudioWorkspace({
  listings,
  locale,
  country,
  blogSystemV1,
  distributionV1,
  marketingIntelligenceV1,
  softLaunchV1,
  adsEngineV1,
  firstUsersV1,
}: Props) {
  const apiRef = React.useRef<EditorCanvasHandle | null>(null);
  const [selection, setSelection] = React.useState<FabricObject | null>(null);
  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("Untitled design");
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [projects, setProjects] = React.useState<{ id: string; title: string; updatedAt: string }[]>([]);
  const [loadOpen, setLoadOpen] = React.useState(false);

  const [city, setCity] = React.useState("Montréal");
  const [audience, setAudience] = React.useState<StudioAudience>("buyer");
  const [listingId, setListingId] = React.useState("");

  const [fontSize, setFontSize] = React.useState(32);
  const [fontFamily, setFontFamily] = React.useState(FONTS[0]);
  const [textColor, setTextColor] = React.useState("#f8fafc");
  const [align, setAlign] = React.useState<"left" | "center" | "right">("left");
  const [brightness, setBrightness] = React.useState(0);
  const [contrast, setContrast] = React.useState(0);
  const [opacity, setOpacity] = React.useState(1);
  const [growthMsg, setGrowthMsg] = React.useState<string | null>(null);
  const [lastBlogId, setLastBlogId] = React.useState<string | null>(null);
  const [listingIntel, setListingIntel] = React.useState<{
    revenueCents: number;
    spendCents: number;
    roiPercent: number | null;
  } | null>(null);

  React.useEffect(() => {
    if (!marketingIntelligenceV1 || !listingId.trim()) {
      setListingIntel(null);
      return;
    }
    const raw = listingId.startsWith("bnhub:")
      ? listingId.slice(7)
      : listingId.startsWith("fsbo:")
        ? listingId.slice(5)
        : listingId;
    void fetch("/api/marketing-system/v2/insights")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: {
          topPerformingSubjects?: { subjectId: string; revenueCents: number; spendCents: number; roiPercent: number | null }[];
        } | null) => {
          const hit = data?.topPerformingSubjects?.find((s) => s.subjectId === raw);
          setListingIntel(hit ?? null);
        }
      )
      .catch(() => setListingIntel(null));
  }, [listingId, marketingIntelligenceV1]);

  const onReady = React.useCallback((api: EditorCanvasHandle) => {
    apiRef.current = api;
  }, []);

  React.useEffect(() => {
    void fetch("/api/marketing-projects")
      .then((r) => (r.ok ? r.json() : Promise.resolve({ projects: [] })))
      .then((d: { projects?: { id: string; title: string; updatedAt: string }[] }) => {
        setProjects(d.projects ?? []);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const id = listingId.trim();
    if (!id) return;
    const row = listings.find((l) => l.id === id);
    if (row?.city) setCity(row.city);
  }, [listingId, listings]);

  const selType = selection?.type ?? null;
  const isText = selType === "i-text" || selType === "text" || selType === "textbox";
  const isImage = selType === "image";
  const isShape = selType === "rect" || selType === "circle" || selType === "line";

  React.useEffect(() => {
    const o = selection;
    if (!o) return;
    if (isText) {
      const t = o as unknown as { fontSize?: number; fontFamily?: string; fill?: string; textAlign?: string };
      if (typeof t.fontSize === "number") setFontSize(t.fontSize);
      if (typeof t.fontFamily === "string") setFontFamily(t.fontFamily);
      if (typeof t.fill === "string") setTextColor(t.fill);
      if (t.textAlign === "left" || t.textAlign === "center" || t.textAlign === "right") {
        setAlign(t.textAlign);
      }
    }
    if (o.opacity != null && typeof o.opacity === "number") setOpacity(o.opacity);
  }, [selection, isText]);

  const applyTextStyle = React.useCallback(() => {
    apiRef.current?.setTextStyle({
      fontSize,
      fontFamily,
      fill: textColor,
      textAlign: align,
    });
  }, [align, fontFamily, fontSize, textColor]);

  const onGenerateAi = React.useCallback(() => {
    const copy = generateStudioMarketingCopy({ city, audience });
    apiRef.current?.placeAiMarketingBlocks({
      headline: copy.headline,
      subhead: copy.subhead,
      cta: copy.cta,
      body: copy.body,
      hashtags: copy.hashtags,
    });
  }, [audience, city]);

  const onExport = React.useCallback((format: ExportFormat) => {
    const url = apiRef.current?.exportDataUrl(format);
    if (!url) return;
    const ext = format === "png" ? "png" : "jpg";
    triggerDownloadDataUrl(url, `${title.replace(/\s+/g, "-").slice(0, 80) || "lecipm-studio"}.${ext}`);
  }, [title]);

  const onSave = React.useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;
    setSaveStatus("saving");
    const projectData = api.getProjectData();
    const payload = {
      title: title.trim() || "Untitled design",
      projectData,
    };
    try {
      const res = projectId
        ? await fetch(`/api/marketing-projects/${projectId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/marketing-projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error("save failed");
      if (!projectId) {
        const data = (await res.json()) as { id: string };
        setProjectId(data.id);
      }
      setSaveStatus("saved");
      void fetch("/api/marketing-projects")
        .then((r) => r.json())
        .then((d: { projects: typeof projects }) => setProjects(d.projects))
        .catch(() => {});
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  }, [projectId, title]);

  const onLoadProject = React.useCallback(async (id: string) => {
    const res = await fetch(`/api/marketing-projects/${id}`);
    if (!res.ok) return;
    const row = (await res.json()) as { title: string; projectData: object };
    setTitle(row.title);
    setProjectId(id);
    await apiRef.current?.loadFromObject(row.projectData);
    setLoadOpen(false);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 text-zinc-100">
      {marketingIntelligenceV1 && listingId && listingIntel ? (
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-2 text-xs text-emerald-100/90">
          <span className="font-semibold text-emerald-200">Listing performance (90d, reported)</span>
          <span className="ml-3">
            Rev ${(listingIntel.revenueCents / 100).toFixed(2)} · Spend ${(listingIntel.spendCents / 100).toFixed(2)} ·
            ROI{" "}
            {listingIntel.roiPercent == null ? "—" : `${listingIntel.roiPercent.toFixed(1)}%`}
          </span>
        </div>
      ) : null}
      <header className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <label className="text-xs text-zinc-500">Design title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">City</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-36 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Audience</span>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as StudioAudience)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            >
              <option value="buyer">Buyer</option>
              <option value="host">Host / BNHub</option>
              <option value="investor">Investor</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Listing (optional)</span>
            <select
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              className="max-w-[200px] rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {(l.title || "Listing").slice(0, 40)}
                  {l.city ? ` · ${l.city}` : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onGenerateAi}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Generate AI copy
          </button>
        </div>
        <div className="flex flex-wrap gap-2 border-l border-zinc-700 pl-3">
          <button
            type="button"
            onClick={() => onExport("png")}
            className="rounded-lg border border-zinc-600 px-3 py-2 text-sm hover:bg-zinc-800"
          >
            Export PNG
          </button>
          <button
            type="button"
            onClick={() => onExport("jpeg")}
            className="rounded-lg border border-zinc-600 px-3 py-2 text-sm hover:bg-zinc-800"
          >
            Export JPG
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveStatus === "saving"}
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {saveStatus === "saving" ? "Saving…" : "Save"}
          </button>
          {saveStatus === "saved" ? <span className="self-center text-xs text-emerald-400">Saved</span> : null}
          {saveStatus === "error" ? <span className="self-center text-xs text-red-400">Save failed</span> : null}
          <div className="relative self-center">
            <button
              type="button"
              onClick={() => setLoadOpen((v) => !v)}
              className="rounded-lg border border-zinc-600 px-3 py-2 text-sm hover:bg-zinc-800"
            >
              Open…
            </button>
            {loadOpen ? (
              <div className="absolute right-0 z-20 mt-1 max-h-64 w-64 overflow-auto rounded-lg border border-zinc-700 bg-zinc-950 py-1 shadow-xl">
                {projects.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500">No saved projects yet.</div>
                ) : (
                  projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-800"
                      onClick={() => void onLoadProject(p.id)}
                    >
                      <span className="block truncate font-medium">{p.title}</span>
                      <span className="text-xs text-zinc-500">
                        {new Date(p.updatedAt).toLocaleString()}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>
        {blogSystemV1 || distributionV1 ? (
          <div className="flex w-full flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Growth v2</span>
            {blogSystemV1 ? (
              <button
                type="button"
                className="rounded-lg border border-violet-600/50 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-950/50"
                onClick={async () => {
                  setGrowthMsg(null);
                  const body = `Marketing Studio design: "${title}".\n\nAdd your story and embed exported PNG/JPG from Export above.`;
                  const res = await fetch("/api/blog", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: `Design: ${title.slice(0, 120) || "Untitled"}`,
                      content: body,
                      status: "DRAFT",
                    }),
                  });
                  const j = (await res.json()) as { id?: string; error?: string };
                  if (!res.ok) {
                    setGrowthMsg(j.error ?? "Could not create blog draft");
                    return;
                  }
                  if (j.id) setLastBlogId(j.id);
                  setGrowthMsg("Blog draft created. Edit under Dashboard → Blog.");
                }}
              >
                Create Blog
              </button>
            ) : null}
            {blogSystemV1 ? (
              <button
                type="button"
                className="rounded-lg border border-violet-600/50 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-950/50"
                onClick={async () => {
                  setGrowthMsg(null);
                  if (listingId.startsWith("bnhub:")) {
                    setGrowthMsg("Campaign launch uses FSBO listings for now. Select an FSBO listing.");
                    return;
                  }
                  const raw = listingId.replace(/^fsbo:/, "");
                  if (!raw) {
                    setGrowthMsg("Pick an FSBO listing first.");
                    return;
                  }
                  const res = await fetch("/api/marketing-system/v2/campaign-from-listing", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ listingId: raw }),
                  });
                  const j = (await res.json()) as { blogPostId?: string; error?: string; distributionNote?: string };
                  if (!res.ok) {
                    setGrowthMsg(j.error ?? "Campaign launch failed");
                    return;
                  }
                  if (j.blogPostId) setLastBlogId(j.blogPostId);
                  setGrowthMsg(j.distributionNote ?? "Campaign draft created.");
                }}
              >
                Generate campaign
              </button>
            ) : null}
            {distributionV1 && blogSystemV1 ? (
              <button
                type="button"
                className="rounded-lg border border-violet-600/50 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-950/50"
                onClick={async () => {
                  setGrowthMsg(null);
                  const id = lastBlogId;
                  if (!id) {
                    setGrowthMsg("Create a blog draft first (button above), then retry.");
                    return;
                  }
                  const res = await fetch(`/api/blog/${id}/distribution`);
                  const j = (await res.json()) as { pack?: unknown; error?: string };
                  if (!res.ok) {
                    setGrowthMsg(j.error ?? "Distribution failed");
                    return;
                  }
                  const text = JSON.stringify(j.pack, null, 2);
                  try {
                    await navigator.clipboard.writeText(text);
                    setGrowthMsg("Distribution pack copied to clipboard (COPY MODE — review before posting).");
                  } catch {
                    setGrowthMsg("Pack ready — check console");
                    console.info("distribution pack", j.pack);
                  }
                }}
              >
                Send to distribution
              </button>
            ) : null}
            {growthMsg ? <span className="text-xs text-zinc-400">{growthMsg}</span> : null}
            {blogSystemV1 ? (
              <a
                href={`/${locale}/${country}/dashboard/blog`}
                className="text-xs text-emerald-400 hover:underline"
              >
                Open blog dashboard →
              </a>
            ) : null}
            {marketingIntelligenceV1 && !softLaunchV1 && !adsEngineV1 && !firstUsersV1 ? (
              <a
                href={`/${locale}/${country}/dashboard/growth/reports`}
                className="text-xs text-sky-400 hover:underline"
              >
                Full ROI & funnel reports →
              </a>
            ) : null}
          </div>
        ) : null}
        {softLaunchV1 || adsEngineV1 || firstUsersV1 ? (
          <div className="flex w-full flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-500/90">
              Soft launch + first 100
            </span>
            {adsEngineV1 ? (
              <button
                type="button"
                className="rounded-lg border border-amber-600/50 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-950/40"
                onClick={async () => {
                  setGrowthMsg(null);
                  const raw = listingId.replace(/^fsbo:/, "").replace(/^bnhub:/, "");
                  const params = new URLSearchParams({
                    city: city.trim() || "Montréal",
                    audience:
                      audience === "host" ? "host" : audience === "investor" ? "investor" : "buyer",
                  });
                  if (raw) params.set("listingId", raw);
                  const res = await fetch(`/api/ads/v1/campaign-draft?${params.toString()}`);
                  const j = (await res.json()) as { error?: string };
                  if (!res.ok) {
                    setGrowthMsg(j.error ?? "Campaign draft failed");
                    return;
                  }
                  try {
                    await navigator.clipboard.writeText(JSON.stringify(j, null, 2));
                    setGrowthMsg("Launch campaign: internal ads draft copied (paste into Google/Meta manually).");
                  } catch {
                    setGrowthMsg("Draft ready — open devtools if clipboard blocked");
                    console.info("ads draft", j);
                  }
                }}
              >
                Launch Campaign
              </button>
            ) : null}
            {marketingIntelligenceV1 ? (
              <a
                href={`/${locale}/${country}/dashboard/growth/reports`}
                className="rounded-lg border border-amber-600/50 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-950/40"
              >
                Track Performance
              </a>
            ) : null}
            {firstUsersV1 ? (
              <button
                type="button"
                className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800"
                onClick={async () => {
                  setGrowthMsg(null);
                  const res = await fetch(`/api/launch/v1/first-users-pack?city=${encodeURIComponent(city)}`);
                  const j = (await res.json()) as { error?: string };
                  if (!res.ok) {
                    setGrowthMsg(j.error ?? "Could not load first-users pack");
                    return;
                  }
                  try {
                    await navigator.clipboard.writeText(JSON.stringify(j, null, 2));
                    setGrowthMsg("First 100 users pack copied (templates + segment quotas).");
                  } catch {
                    console.info("first users", j);
                    setGrowthMsg("Pack logged to console");
                  }
                }}
              >
                First 100 playbook
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="grid flex-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-semibold text-zinc-300">Templates</h2>
          <p className="text-xs text-zinc-500">Replaces canvas content with a preset layout.</p>
          <ul className="space-y-2">
            {(Object.keys(MARKETING_TEMPLATE_LABELS) as MarketingTemplateId[]).map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => apiRef.current?.applyTemplate(id)}
                  className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-left text-sm hover:border-emerald-600/50 hover:bg-zinc-800"
                >
                  {MARKETING_TEMPLATE_LABELS[id]}
                </button>
              </li>
            ))}
          </ul>
          <h3 className="pt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Add</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded border border-zinc-600 px-2 py-1 text-xs"
              onClick={() => apiRef.current?.addText()}
            >
              Text
            </button>
            <button
              type="button"
              className="rounded border border-zinc-600 px-2 py-1 text-xs"
              onClick={() => apiRef.current?.addRect()}
            >
              Rect
            </button>
            <button
              type="button"
              className="rounded border border-zinc-600 px-2 py-1 text-xs"
              onClick={() => apiRef.current?.addCircle()}
            >
              Circle
            </button>
            <button
              type="button"
              className="rounded border border-zinc-600 px-2 py-1 text-xs"
              onClick={() => apiRef.current?.addLine()}
            >
              Line
            </button>
            <label className="cursor-pointer rounded border border-zinc-600 px-2 py-1 text-xs hover:bg-zinc-800">
              Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) apiRef.current?.applyImageFromFile(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </aside>

        <section className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
            <button type="button" className="hover:text-zinc-300" onClick={() => apiRef.current?.undo()}>
              Undo
            </button>
            <button type="button" className="hover:text-zinc-300" onClick={() => apiRef.current?.redo()}>
              Redo
            </button>
            <button type="button" className="hover:text-zinc-300" onClick={() => apiRef.current?.deleteSelected()}>
              Delete
            </button>
            <button type="button" className="hover:text-zinc-300" onClick={() => apiRef.current?.duplicateSelected()}>
              Duplicate
            </button>
            <button type="button" className="hover:text-zinc-300" onClick={() => apiRef.current?.bringForward()}>
              Layer up
            </button>
            <button type="button" className="hover:text-zinc-300" onClick={() => apiRef.current?.sendBackwards()}>
              Layer down
            </button>
          </div>
          <div className="max-h-[min(78vh,960px)] overflow-auto rounded-xl">
            <EditorCanvas onReady={onReady} onSelectionChange={setSelection} />
          </div>
        </section>

        <aside className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-semibold text-zinc-300">Properties</h2>
          {!selection ? (
            <p className="text-sm text-zinc-500">Select an object on the canvas.</p>
          ) : null}

          {isText ? (
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-zinc-500">Size</label>
                <input
                  type="number"
                  min={8}
                  max={200}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  onBlur={applyTextStyle}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Font</label>
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    setFontFamily(e.target.value);
                    setTimeout(applyTextStyle, 0);
                  }}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1"
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f.split(",")[0]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border border-zinc-600 px-2 py-1 text-xs"
                  onClick={() => {
                    apiRef.current?.setTextStyle({ fontWeight: "700" });
                  }}
                >
                  Bold
                </button>
                <button
                  type="button"
                  className="rounded border border-zinc-600 px-2 py-1 text-xs"
                  onClick={() => {
                    apiRef.current?.setTextStyle({ fontStyle: "italic" });
                  }}
                >
                  Italic
                </button>
              </div>
              <div>
                <label className="text-xs text-zinc-500">Color</label>
                <input
                  type="color"
                  value={textColor.startsWith("#") ? textColor : "#ffffff"}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    apiRef.current?.setTextStyle({ fill: e.target.value });
                  }}
                  className="mt-1 h-9 w-full cursor-pointer rounded border border-zinc-700 bg-zinc-950"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Align</label>
                <div className="mt-1 flex gap-1">
                  {(["left", "center", "right"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setAlign(a);
                        apiRef.current?.setTextStyle({ textAlign: a });
                      }}
                      className={`flex-1 rounded px-2 py-1 text-xs capitalize ${
                        align === a ? "bg-emerald-700" : "border border-zinc-600"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500">Shadow</label>
                <button
                  type="button"
                  className="mt-1 w-full rounded border border-zinc-600 px-2 py-1 text-xs"
                  onClick={() =>
                    apiRef.current?.setTextStyle({
                      shadow: {
                        color: "rgba(0,0,0,0.45)",
                        blur: 8,
                        offsetX: 2,
                        offsetY: 4,
                      },
                    })
                  }
                >
                  Apply soft shadow
                </button>
                <button
                  type="button"
                  className="mt-1 w-full rounded border border-zinc-600 px-2 py-1 text-xs"
                  onClick={() => apiRef.current?.setTextStyle({ shadow: null })}
                >
                  Remove shadow
                </button>
              </div>
            </div>
          ) : null}

          {isImage ? (
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-zinc-500">Brightness ({brightness})</label>
                <input
                  type="range"
                  min={-0.5}
                  max={0.5}
                  step={0.05}
                  value={brightness}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setBrightness(v);
                    apiRef.current?.setImageBrightnessContrast(v, contrast);
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Contrast ({contrast})</label>
                <input
                  type="range"
                  min={-0.5}
                  max={0.5}
                  step={0.05}
                  value={contrast}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setContrast(v);
                    apiRef.current?.setImageBrightnessContrast(brightness, v);
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Opacity</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setOpacity(v);
                    apiRef.current?.setSelectedOpacity(v);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          ) : null}

          {isShape ? (
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-zinc-500">{selType === "line" ? "Line color" : "Fill"}</label>
                <input
                  type="color"
                  onChange={(e) => apiRef.current?.setSelectedFill(e.target.value)}
                  className="mt-1 h-9 w-full cursor-pointer rounded border border-zinc-700"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Stroke</label>
                <input
                  type="color"
                  onChange={(e) => apiRef.current?.setSelectedStroke(e.target.value)}
                  className="mt-1 h-9 w-full cursor-pointer rounded border border-zinc-700"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Opacity</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setOpacity(v);
                    apiRef.current?.setSelectedOpacity(v);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
