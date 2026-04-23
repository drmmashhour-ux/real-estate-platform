import type { MarketingContentItem, MarketingContentType, MarketingPlatform, MarketingAudience, MarketingGoal } from "./content.types";
import { studioStorageGet, studioStorageSet, __resetStudioMemoryStore } from "./studio-local-storage";

const KEY = "lecipm-marketing-studio-content-v1";

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `mc_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readAll(): MarketingContentItem[] {
  const raw = studioStorageGet(KEY);
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p as MarketingContentItem[];
  } catch {
    return [];
  }
}

function writeAll(items: MarketingContentItem[]) {
  studioStorageSet(KEY, JSON.stringify(items));
}

export function listMarketingContent(): MarketingContentItem[] {
  return readAll().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getMarketingContent(id: string): MarketingContentItem | null {
  return readAll().find((c) => c.id === id) ?? null;
}

export type CreateMarketingContentInput = {
  title: string;
  type: MarketingContentType;
  platform: MarketingPlatform;
  audience: MarketingAudience;
  goal: MarketingGoal;
  caption?: string;
  tags?: string[];
  scriptId?: string;
  videoProjectId?: string;
};

export function createMarketingContent(input: CreateMarketingContentInput): MarketingContentItem {
  const t = nowIso();
  const item: MarketingContentItem = {
    id: newId(),
    title: input.title.trim() || "Untitled",
    type: input.type,
    platform: input.platform,
    audience: input.audience,
    goal: input.goal,
    caption: input.caption,
    scriptId: input.scriptId,
    videoProjectId: input.videoProjectId,
    tags: (input.tags ?? []).map((x) => x.trim().toLowerCase()).filter(Boolean),
    createdAt: t,
    updatedAt: t,
  };
  const all = readAll();
  all.push(item);
  writeAll(all);
  return item;
}

export function updateMarketingContent(
  id: string,
  patch: Partial<
    Pick<
      MarketingContentItem,
      "title" | "caption" | "tags" | "scriptId" | "videoProjectId" | "type" | "platform" | "audience" | "goal"
    >
  >
): MarketingContentItem | null {
  const all = readAll();
  const i = all.findIndex((c) => c.id === id);
  if (i < 0) return null;
  const cur = all[i]!;
  const next: MarketingContentItem = {
    ...cur,
    ...patch,
    title: patch.title != null ? patch.title.trim() || cur.title : cur.title,
    tags: patch.tags != null ? patch.tags.map((x) => x.trim().toLowerCase()).filter(Boolean) : cur.tags,
    updatedAt: nowIso(),
  };
  all[i] = next;
  writeAll(all);
  return next;
}

export function deleteMarketingContent(id: string): boolean {
  const all = readAll();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  writeAll(next);
  return true;
}

export function importMarketingContentJson(json: string): { ok: true; count: number } | { ok: false; error: string } {
  let arr: unknown;
  try {
    arr = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
  if (!Array.isArray(arr)) return { ok: false, error: "Expected array" };
  const parsed = arr.filter((x): x is MarketingContentItem => typeof x === "object" && x != null && "id" in x);
  writeAll(parsed);
  return { ok: true, count: parsed.length };
}

export function exportAllMarketingContentJson(): string {
  return JSON.stringify(readAll(), null, 2);
}

export function __resetMarketingContentForTests() {
  resetStudioStorageKey(KEY);
}
