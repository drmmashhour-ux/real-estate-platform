import type { MarketingAsset, MarketingAssetType } from "./content.types";
import { studioStorageGet, studioStorageSet, __resetStudioMemoryStore } from "./studio-local-storage";

const KEY = "lecipm-marketing-studio-assets-v1";
const MAX_DATA_PREVIEW = 400_000; // ~400KB in localStorage; avoid huge data URLs in production

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `as_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readAll(): MarketingAsset[] {
  const raw = studioStorageGet(KEY);
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as MarketingAsset[]) : [];
  } catch {
    return [];
  }
}

function writeAll(rows: MarketingAsset[]) {
  studioStorageSet(KEY, JSON.stringify(rows));
}

function normalizeTags(s: string): string[] {
  return s
    .split(/[,\n]+/g)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

export function listAssets(): MarketingAsset[] {
  return readAll().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function searchAssets(q: string): MarketingAsset[] {
  const t = q.trim().toLowerCase();
  if (!t) return listAssets();
  return readAll().filter(
    (a) =>
      a.title.toLowerCase().includes(t) ||
      a.tags.some((g) => g.includes(t)) ||
      a.data.toLowerCase().includes(t) ||
      (a.contentId && a.contentId.toLowerCase().includes(t))
  );
}

export function getAsset(id: string): MarketingAsset | null {
  return readAll().find((a) => a.id === id) ?? null;
}

export function addAsset(input: {
  type: MarketingAssetType;
  title: string;
  data: string;
  tagsInput?: string;
  contentId?: string;
}): MarketingAsset {
  const tags = normalizeTags(input.tagsInput ?? "");
  const data =
    input.data.length > MAX_DATA_PREVIEW ? `${input.data.slice(0, MAX_DATA_PREVIEW)}…[truncated]` : input.data;
  const t = nowIso();
  const row: MarketingAsset = {
    id: newId(),
    type: input.type,
    title: input.title.trim() || "Asset",
    tags,
    data,
    contentId: input.contentId,
    createdAt: t,
    updatedAt: t,
  };
  const all = readAll();
  all.push(row);
  writeAll(all);
  return row;
}

export function updateAsset(
  id: string,
  patch: Partial<Pick<MarketingAsset, "title" | "data" | "contentId"> & { tagsInput?: string }>
): MarketingAsset | null {
  const all = readAll();
  const i = all.findIndex((a) => a.id === id);
  if (i < 0) return null;
  const cur = all[i]!;
  const next: MarketingAsset = {
    ...cur,
    title: patch.title != null ? patch.title.trim() || cur.title : cur.title,
    data: patch.data != null ? patch.data : cur.data,
    contentId: patch.contentId != null ? patch.contentId : cur.contentId,
    tags: patch.tagsInput != null ? normalizeTags(patch.tagsInput) : cur.tags,
    updatedAt: nowIso(),
  };
  if (next.data.length > MAX_DATA_PREVIEW) {
    next.data = `${next.data.slice(0, MAX_DATA_PREVIEW)}…[truncated]`;
  }
  all[i] = next;
  writeAll(all);
  return next;
}

export function deleteAsset(id: string): boolean {
  const all = readAll();
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return false;
  writeAll(next);
  return true;
}

export function __resetAssetsForTests() {
  resetStudioStorageKey(KEY);
}
