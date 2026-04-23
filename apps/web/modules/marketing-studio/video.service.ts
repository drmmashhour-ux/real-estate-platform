import type {
  MarketingPlatform,
  MarketingAudience,
  MarketingGoal,
  VideoProject,
  VideoScene,
  VideoSceneId,
} from "./content.types";
import { generateVideoScript } from "./script.service";
import { studioStorageGet, studioStorageSet, __resetStudioMemoryStore } from "./studio-local-storage";

const KEY = "lecipm-marketing-studio-videos-v1";

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `vp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readAll(): VideoProject[] {
  const raw = studioStorageGet(KEY);
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as VideoProject[]) : [];
  } catch {
    return [];
  }
}

function writeAll(rows: VideoProject[]) {
  studioStorageSet(KEY, JSON.stringify(rows));
}

const DEFAULT_LABELS: Record<VideoSceneId, string> = {
  hook: "Scene 1 — Hook (first 3s)",
  problem: "Scene 2 — Problem",
  solution: "Scene 3 — Solution",
  cta: "Scene 4 — CTA",
};

/**
 * Build the standard 4-scene storyboard, seeded from the script service.
 */
export function buildDefaultScenes(
  input: { platform: MarketingPlatform; audience: MarketingAudience; goal: MarketingGoal; title: string },
  custom?: Partial<Record<VideoSceneId, { text?: string; overlay?: string }>>
): VideoScene[] {
  const s = generateVideoScript(input);
  const scenes: VideoScene[] = [
    { id: "hook", label: DEFAULT_LABELS.hook, text: s.hook, overlay: custom?.hook?.overlay ?? "HOOK" },
    {
      id: "problem",
      label: DEFAULT_LABELS.problem,
      text: "Name the pain in one sentence your viewer already felt today.",
      overlay: custom?.problem?.overlay ?? "PROBLEM",
    },
    {
      id: "solution",
      label: DEFAULT_LABELS.solution,
      text: s.mainMessage,
      overlay: custom?.solution?.overlay ?? "SOLUTION",
    },
    { id: "cta", label: DEFAULT_LABELS.cta, text: s.cta, overlay: custom?.cta?.overlay ?? "CTA" },
  ];
  for (const sc of scenes) {
    const o = custom?.[sc.id];
    if (o?.text) sc.text = o.text;
  }
  return scenes;
}

export function createVideoProject(input: {
  contentId: string;
  title: string;
  platform: MarketingPlatform;
  audience: MarketingAudience;
  goal: MarketingGoal;
  initialScenes?: VideoScene[];
}): VideoProject {
  const t = nowIso();
  const scenes = input.initialScenes ?? buildDefaultScenes({ ...input, title: input.title });
  const row: VideoProject = {
    id: newId(),
    title: input.title.trim() || "Video",
    contentId: input.contentId,
    platform: input.platform,
    audience: input.audience,
    goal: input.goal,
    scenes,
    createdAt: t,
    updatedAt: t,
  };
  const all = readAll();
  all.push(row);
  writeAll(all);
  return row;
}

export function getVideoProject(id: string): VideoProject | null {
  return readAll().find((r) => r.id === id) ?? null;
}

export function listVideoProjects(): VideoProject[] {
  return readAll().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function listVideoProjectsForContent(contentId: string): VideoProject[] {
  return readAll().filter((r) => r.contentId === contentId);
}

export function updateVideoScene(
  projectId: string,
  sceneId: VideoSceneId,
  patch: Partial<Pick<VideoScene, "text" | "overlay" | "imageDataUrl" | "videoDataUrl" | "label">>
): VideoProject | null {
  const all = readAll();
  const i = all.findIndex((r) => r.id === projectId);
  if (i < 0) return null;
  const p = all[i]!;
  const j = p.scenes.findIndex((s) => s.id === sceneId);
  if (j < 0) return null;
  const scenes = [...p.scenes];
  scenes[j] = { ...scenes[j]!, ...patch, id: sceneId } as VideoScene;
  all[i] = { ...p, scenes, updatedAt: nowIso() };
  writeAll(all);
  return all[i]!;
}

export function updateVideoProjectMeta(projectId: string, patch: Partial<Pick<VideoProject, "title">>): VideoProject | null {
  const all = readAll();
  const i = all.findIndex((r) => r.id === projectId);
  if (i < 0) return null;
  all[i] = { ...all[i]!, ...patch, updatedAt: nowIso() };
  writeAll(all);
  return all[i]!;
}

export function deleteVideoProject(id: string): boolean {
  const all = readAll();
  const next = all.filter((r) => r.id !== id);
  if (next.length === all.length) return false;
  writeAll(next);
  return true;
}

/** JSON payload for a future headless video renderer. */
export function toVideoRenderPayload(project: VideoProject) {
  return {
    version: 1,
    id: project.id,
    title: project.title,
    platform: project.platform,
    audioScript: project.scenes.map((s) => s.text).join("\n\n"),
    scenes: project.scenes.map((s) => ({
      id: s.id,
      text: s.text,
      overlay: s.overlay,
      hasImage: Boolean(s.imageDataUrl),
      hasVideo: Boolean(s.videoDataUrl),
    })),
  };
}

export function __resetVideoProjectsForTests() {
  resetStudioStorageKey(KEY);
}
