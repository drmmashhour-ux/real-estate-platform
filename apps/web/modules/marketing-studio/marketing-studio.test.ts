import { describe, expect, it, beforeEach } from "vitest";

import { addAsset, listAssets, searchAssets } from "./asset-library.service";
import { createMarketingContent, exportAllMarketingContentJson, listMarketingContent } from "./content.service";
import { buildExportBundle } from "./content-export.service";
import { generateVideoScript } from "./script.service";
import { buildDefaultScenes, toVideoRenderPayload, createVideoProject } from "./video.service";
import { resetStudioStorageKey } from "./studio-local-storage";

const KEYS = [
  "lecipm-marketing-studio-content-v1",
  "lecipm-marketing-studio-videos-v1",
  "lecipm-marketing-studio-assets-v1",
];

function resetAll() {
  for (const k of KEYS) resetStudioStorageKey(k);
}

beforeEach(() => {
  resetAll();
});

describe("marketing content service", () => {
  it("creates and lists content", () => {
    const a = createMarketingContent({
      title: "T1",
      type: "TEXT",
      platform: "YOUTUBE",
      audience: "broker",
      goal: "awareness",
    });
    expect(a.id).toBeTruthy();
    const all = listMarketingContent();
    expect(all).toHaveLength(1);
    expect(all[0]!.title).toBe("T1");
  });

  it("exports JSON for backup", () => {
    createMarketingContent({
      title: "X",
      type: "CAMPAIGN",
      platform: "INSTAGRAM",
      audience: "buyer",
      goal: "conversion",
    });
    const json = exportAllMarketingContentJson();
    expect(json).toContain("X");
  });
});

describe("script.service", () => {
  it("generates hook, main, CTA", () => {
    const s = generateVideoScript({
      platform: "TIKTOK",
      audience: "buyer",
      goal: "leads",
      title: "Test title",
    });
    expect(s.hook.length).toBeGreaterThan(5);
    expect(s.mainMessage.length).toBeGreaterThan(10);
    expect(s.cta.length).toBeGreaterThan(5);
    expect(s.fullScript).toContain(s.hook);
  });
});

describe("video.service", () => {
  it("builds four scenes and render payload", () => {
    const item = createMarketingContent({
      title: "V",
      type: "VIDEO",
      platform: "INSTAGRAM",
      audience: "investor",
      goal: "leads",
    });
    const vp = createVideoProject({
      contentId: item.id,
      title: "V",
      platform: "INSTAGRAM",
      audience: "investor",
      goal: "leads",
    });
    const payload = toVideoRenderPayload(vp);
    expect(payload.scenes).toHaveLength(4);
    expect(payload.scenes[0]!.id).toBe("hook");
  });

  it("default scenes are editable templates", () => {
    const scenes = buildDefaultScenes({
      platform: "YOUTUBE",
      audience: "host",
      goal: "awareness",
      title: "A",
    });
    expect(scenes.map((s) => s.id).join()).toBe("hook,problem,solution,cta");
  });
});

describe("asset-library.service", () => {
  it("stores and searches by tag", () => {
    addAsset({ type: "script", title: "S1", data: "hello world", tagsInput: "winter, promo" });
    addAsset({ type: "image", title: "I1", data: "x", tagsInput: "summer" });
    expect(listAssets()).toHaveLength(2);
    expect(searchAssets("winter")).toHaveLength(1);
  });
});

describe("content-export.service", () => {
  it("builds text and json bundles", () => {
    const c = createMarketingContent({
      title: "E",
      type: "TEXT",
      platform: "TIKTOK",
      audience: "buyer",
      goal: "leads",
      caption: "Cap",
    });
    const t = buildExportBundle(c, "caption");
    expect(t.mime).toContain("text");
    const item = { ...c, id: c.id, videoProjectId: undefined, scriptId: undefined, tags: [], createdAt: c.createdAt, updatedAt: c.updatedAt };
    const v = buildDefaultScenes(
      { platform: c.platform, audience: c.audience, goal: c.goal, title: c.title }
    );
    const vp = createVideoProject({
      contentId: item.id,
      title: item.title,
      platform: item.platform,
      audience: item.audience,
      goal: item.goal,
      initialScenes: v,
    });
    const j = buildExportBundle({ ...c, videoProjectId: vp.id }, "video_json", { videoProject: vp });
    expect(j.body).toContain("hook");
  });
});
