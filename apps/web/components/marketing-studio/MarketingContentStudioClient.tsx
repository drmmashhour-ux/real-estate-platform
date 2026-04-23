"use client";

import * as React from "react";
import Link from "next/link";
import {
  createMarketingContent,
  listMarketingContent,
  updateMarketingContent,
  getMarketingContent,
  deleteMarketingContent,
  type CreateMarketingContentInput,
} from "@/modules/marketing-studio/content.service";
import { generateVideoScript, fullScriptToCaption } from "@/modules/marketing-studio/script.service";
import { createVideoProject, getVideoProject, listVideoProjectsForContent, updateVideoScene } from "@/modules/marketing-studio/video.service";
import { addAsset, listAssets, searchAssets, deleteAsset } from "@/modules/marketing-studio/asset-library.service";
import { buildExportBundle, downloadContentExportBundle } from "@/modules/marketing-studio/content-export.service";
import type { MarketingContentItem, MarketingPlatform, VideoSceneId } from "@/modules/marketing-studio/content.types";
import { PosterEditor } from "./PosterEditor";

type Tab = "create" | "edit" | "assets" | "export";

const PLATFORMS: MarketingPlatform[] = ["TIKTOK", "INSTAGRAM", "YOUTUBE"];

type Props = {
  basePath: string;
  fullStudioHref: string;
};

export function MarketingContentStudioClient({ basePath, fullStudioHref }: Props) {
  const [tab, setTab] = React.useState<Tab>("create");
  const [items, setItems] = React.useState<MarketingContentItem[]>([]);
  const [assets, setAssets] = React.useState(() => listAssets());
  const [search, setSearch] = React.useState("");

  const refresh = React.useCallback(() => {
    setItems(listMarketingContent());
    setAssets(search.trim() ? searchAssets(search) : listAssets());
  }, [search]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // Create form
  const [cTitle, setCTitle] = React.useState("Spring campaign");
  const [cType, setCType] = React.useState<CreateMarketingContentInput["type"]>("CAMPAIGN");
  const [cPlat, setCPlat] = React.useState<MarketingPlatform>("INSTAGRAM");
  const [cAud, setCAud] = React.useState<CreateMarketingContentInput["audience"]>("buyer");
  const [cGoal, setCGoal] = React.useState<CreateMarketingContentInput["goal"]>("leads");
  const [cTags, setCTags] = React.useState("q2, lecipm");

  const onCreate = () => {
    const script = generateVideoScript({ platform: cPlat, audience: cAud, goal: cGoal, title: cTitle });
    const item = createMarketingContent({
      title: cTitle,
      type: cType,
      platform: cPlat,
      audience: cAud,
      goal: cGoal,
      tags: cTags.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean),
      caption: fullScriptToCaption(script, 2000),
    });
    if (cType === "VIDEO" || cType === "CAMPAIGN") {
      const video = createVideoProject({
        contentId: item.id,
        title: cTitle,
        platform: cPlat,
        audience: cAud,
        goal: cGoal,
      });
      updateMarketingContent(item.id, { videoProjectId: video.id });
    }
    addAsset({
      type: "script",
      title: `Script: ${cTitle}`.slice(0, 80),
      data: script.fullScript,
      tagsInput: `script, ${cTags}`,
      contentId: item.id,
    });
    refresh();
    setEditId(item.id);
    setTab("edit");
  };

  // Edit
  const [editId, setEditId] = React.useState<string | null>(null);
  const edit = editId ? getMarketingContent(editId) : null;
  const videoForEdit = edit?.videoProjectId ? getVideoProject(edit.videoProjectId) : null;

  const onSaveEdit = () => {
    if (!editId) return;
    const cap = (document.getElementById("ms-caption") as HTMLTextAreaElement | null)?.value;
    updateMarketingContent(editId, { caption: cap });
    refresh();
  };

  const onScene = (sceneId: VideoSceneId, text: string) => {
    if (!videoForEdit) return;
    updateVideoScene(videoForEdit.id, sceneId, { text });
    refresh();
  };

  // Export
  const [exId, setExId] = React.useState<string | null>(null);
  const ex = exId ? getMarketingContent(exId) : null;
  const exVideo = ex?.videoProjectId ? getVideoProject(ex.videoProjectId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["create", "1. Create"],
            ["edit", "2. Edit content"],
            ["assets", "3. Asset library"],
            ["export", "4. Export"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              tab === id
                ? "rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-zinc-950"
                : "rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 hover:border-amber-500/50"
            }
          >
            {label}
          </button>
        ))}
        <Link href={fullStudioHref} className="ml-auto text-sm text-amber-400 hover:underline">
          Visual design (Fabric) →
        </Link>
        <Link href={basePath} className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Dashboard
        </Link>
      </div>

      {tab === "create" && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Create content</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Structured record + generated script. Video projects get a 4-scene storyboard (hook / problem / solution / CTA).
          </p>
          <div className="mt-4 grid max-w-lg gap-3">
            <label className="text-sm text-zinc-300">
              Title
              <input
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
              />
            </label>
            <label className="text-sm text-zinc-300">
              Type
              <select
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                value={cType}
                onChange={(e) => setCType(e.target.value as CreateMarketingContentInput["type"])}
              >
                <option value="CAMPAIGN">CAMPAIGN</option>
                <option value="VIDEO">VIDEO</option>
                <option value="POSTER">POSTER</option>
                <option value="TEXT">TEXT</option>
              </select>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="text-sm text-zinc-300">
                Platform
                <select
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                  value={cPlat}
                  onChange={(e) => setCPlat(e.target.value as MarketingPlatform)}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-zinc-300">
                Audience
                <select
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                  value={cAud}
                  onChange={(e) => setCAud(e.target.value as CreateMarketingContentInput["audience"])}
                >
                  <option value="buyer">buyer</option>
                  <option value="broker">broker</option>
                  <option value="investor">investor</option>
                  <option value="host">host</option>
                </select>
              </label>
              <label className="text-sm text-zinc-300">
                Goal
                <select
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                  value={cGoal}
                  onChange={(e) => setCGoal(e.target.value as CreateMarketingContentInput["goal"])}
                >
                  <option value="leads">leads</option>
                  <option value="awareness">awareness</option>
                  <option value="conversion">conversion</option>
                </select>
              </label>
            </div>
            <label className="text-sm text-zinc-300">
              Tags
              <input
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                value={cTags}
                onChange={(e) => setCTags(e.target.value)}
                placeholder="comma separated"
              />
            </label>
            <button
              type="button"
              onClick={onCreate}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
            >
              Create
            </button>
          </div>
        </section>
      )}

      {tab === "edit" && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold text-zinc-100">Edit content</h2>
            <select
              className="mt-3 w-full max-w-xl rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
              value={editId ?? ""}
              onChange={(e) => setEditId(e.target.value || null)}
            >
              <option value="">Select…</option>
              {items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} — {c.type} — {c.platform}
                </option>
              ))}
            </select>
            {edit ? (
              <div className="mt-4 space-y-3 max-w-xl">
                <p className="text-xs text-zinc-500">ID: {edit.id}</p>
                <label className="text-sm text-zinc-300 block">
                  Caption (social)
                  <textarea
                    id="ms-caption"
                    className="mt-1 w-full min-h-[120px] rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                    defaultValue={edit.caption ?? ""}
                    key={edit.id + (edit.caption ?? "")}
                  />
                </label>
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="rounded-lg border border-amber-500/50 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-500/10"
                >
                  Save caption
                </button>
                {edit.type === "POSTER" || edit.type === "CAMPAIGN" ? (
                  <div className="mt-6 border-t border-zinc-800 pt-4">
                    <h3 className="text-sm font-medium text-zinc-300">Poster (black + gold)</h3>
                    <PosterEditor
                      onExported={(dataUrl) => {
                        addAsset({ type: "image", title: `Poster: ${edit.title}`.slice(0, 80), data: dataUrl, contentId: edit.id, tagsInput: "poster, export" });
                        refresh();
                      }}
                    />
                  </div>
                ) : null}
                {videoForEdit ? (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <h3 className="text-sm font-medium text-zinc-300">Video storyboard</h3>
                    <ul className="mt-2 space-y-2">
                      {videoForEdit.scenes.map((s) => (
                        <li key={s.id} className="rounded-lg border border-zinc-800 p-2">
                          <p className="text-xs text-amber-500/80">{s.label}</p>
                          <textarea
                            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
                            defaultValue={s.text}
                            onBlur={(e) => onScene(s.id, e.target.value)}
                            rows={2}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (editId) deleteMarketingContent(editId);
                    setEditId(null);
                    refresh();
                  }}
                  className="text-sm text-red-400 hover:underline"
                >
                  Delete item
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">No selection.</p>
            )}
          </section>
        </div>
      )}

      {tab === "assets" && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Asset library</h2>
          <input
            className="mt-3 w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            placeholder="Search title, tags, text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="mt-4 space-y-2">
            {assets.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-200">{a.title}</p>
                  <p className="text-xs text-zinc-500">
                    {a.type} · {a.tags.join(", ")}
                    {a.contentId ? ` · content ${a.contentId.slice(0, 8)}` : ""}
                  </p>
                  {a.type === "script" || a.data.length < 200 ? (
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{a.data}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    deleteAsset(a.id);
                    refresh();
                  }}
                  className="shrink-0 text-xs text-red-400"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "export" && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Export</h2>
          <p className="mt-1 text-sm text-zinc-500">Download .txt / .json. Rendered video export is a future step.</p>
          <select
            className="mt-3 w-full max-w-xl rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
            value={exId ?? ""}
            onChange={(e) => setExId(e.target.value || null)}
          >
            <option value="">Select content…</option>
            {items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {ex ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const scriptText =
                    ex.caption ||
                    generateVideoScript({
                      platform: ex.platform,
                      audience: ex.audience,
                      goal: ex.goal,
                      title: ex.title,
                    }).fullScript;
                  const b = buildExportBundle(ex, "script", { scriptText });
                  downloadContentExportBundle(b);
                }}
                className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200"
              >
                Script (.txt)
              </button>
              <button
                type="button"
                onClick={() => {
                  const b = buildExportBundle(ex, "caption");
                  downloadContentExportBundle(b);
                }}
                className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200"
              >
                Caption (.txt)
              </button>
              {exVideo ? (
                <button
                  type="button"
                  onClick={() => {
                    const b = buildExportBundle(ex, "video_json", { videoProject: exVideo });
                    downloadContentExportBundle(b);
                  }}
                  className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-sm text-amber-200"
                >
                  Video storyboard (JSON)
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
