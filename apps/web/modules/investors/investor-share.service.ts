/**
 * In-memory share links — process lifetime; rotate/revoke for operational control.
 * Public loads use filtered snapshots only (never raw admin payloads).
 *
 * Contract (do not regress):
 * - Read-only public surface; no actions, no admin APIs, no raw internal dashboard JSON.
 * - Tokens: cryptographically random; revoked/expired/unknown → same generic failure (no enumeration).
 * - `buildInvestorSharedDashboard` always runs `filterInvestorDashboardForShare` — never return unfiltered internal payloads.
 */

import { randomBytes, randomUUID } from "crypto";
import { buildInvestorDashboard } from "@/modules/investors/investor-dashboard.service";
import {
  filterInvestorDashboardForShare,
  scrubInvestorShareText,
} from "@/modules/investors/investor-share-filter.service";
import {
  logInvestorShareCreated,
  logInvestorShareInvalid,
  logInvestorShareRevoked,
  logInvestorShareView,
} from "@/modules/investors/investor-share-monitoring.service";
import type { InvestorShareLink, InvestorSharedDashboard, InvestorShareVisibility } from "@/modules/investors/investor-share.types";

type ShareStore = {
  byId: Map<string, InvestorShareLink>;
  tokenToId: Map<string, string>;
};

function getShareStore(): ShareStore {
  const g = globalThis as unknown as { __investorShareLinksV1?: ShareStore };
  if (!g.__investorShareLinksV1) {
    g.__investorShareLinksV1 = {
      byId: new Map(),
      tokenToId: new Map(),
    };
  }
  return g.__investorShareLinksV1;
}

/** Test-only reset. */
export function clearInvestorShareStoreForTests(): void {
  const s = getShareStore();
  s.byId.clear();
  s.tokenToId.clear();
}

function isPastExpiry(expiresAt: string | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) <= new Date();
}

function normalizeLinkInPlace(link: InvestorShareLink): InvestorShareLink {
  if (link.status !== "active") return link;
  if (isPastExpiry(link.expiresAt)) {
    const expired: InvestorShareLink = { ...link, status: "expired" };
    getShareStore().byId.set(link.id, expired);
    return expired;
  }
  return link;
}

type ResolveResult =
  | { ok: true; link: InvestorShareLink }
  | { ok: false; kind: "not_found" | "revoked" | "expired" };

function resolveToken(rawToken: string): ResolveResult {
  const store = getShareStore();
  const id = store.tokenToId.get(rawToken);
  if (!id) return { ok: false, kind: "not_found" };
  const entry = store.byId.get(id);
  if (!entry) return { ok: false, kind: "not_found" };
  const link = normalizeLinkInPlace(entry);
  if (link.status === "revoked") return { ok: false, kind: "revoked" };
  if (link.status === "expired") return { ok: false, kind: "expired" };
  return { ok: true, link };
}

/**
 * Returns only active, non-expired links; logs invalid access kinds for monitoring.
 */
export function getInvestorShareLinkByToken(rawToken: string): InvestorShareLink | null {
  const r = resolveToken(rawToken);
  if (r.ok) return r.link;
  logInvestorShareInvalid(r.kind);
  return null;
}

export function listInvestorShareLinks(): InvestorShareLink[] {
  return Array.from(getShareStore().byId.values()).map((l) => normalizeLinkInPlace(l));
}

export async function createInvestorShareLink(params: {
  visibility: InvestorShareVisibility;
  publicTitle: string;
  publicSubtitle?: string;
  label?: string;
  expiresAt?: string;
  createdBy?: string;
  windowDays?: number;
}): Promise<InvestorShareLink> {
  const store = getShareStore();
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  const windowDays = Math.min(45, Math.max(7, params.windowDays ?? 14));
  const link: InvestorShareLink = {
    id,
    token,
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt: params.expiresAt,
    createdBy: params.createdBy,
    label: params.label,
    publicTitle: params.publicTitle.trim().slice(0, 200) || "Investor summary",
    publicSubtitle: params.publicSubtitle?.trim().slice(0, 300),
    visibility: params.visibility,
    viewCount: 0,
    windowDays,
  };
  store.byId.set(id, link);
  store.tokenToId.set(token, id);
  logInvestorShareCreated({ shareId: id, hasExpiry: !!params.expiresAt });
  return link;
}

export function revokeInvestorShareLink(id: string): boolean {
  const store = getShareStore();
  const link = store.byId.get(id);
  if (!link) return false;
  const current = normalizeLinkInPlace(link);
  if (current.status !== "active") return false;
  store.byId.set(id, { ...current, status: "revoked" });
  logInvestorShareRevoked(id);
  return true;
}

/**
 * Increment views after a successful active-token resolve (caller validates token first).
 */
export function recordInvestorShareView(link: InvestorShareLink): InvestorShareLink {
  const store = getShareStore();
  const next: InvestorShareLink = {
    ...link,
    viewCount: link.viewCount + 1,
    lastViewedAt: new Date().toISOString(),
  };
  store.byId.set(link.id, next);
  logInvestorShareView(link.id, next.viewCount);
  return next;
}

export async function buildInvestorSharedDashboard(link: InvestorShareLink): Promise<InvestorSharedDashboard> {
  const internal = await buildInvestorDashboard(link.windowDays);
  const filtered = filterInvestorDashboardForShare(internal, link.visibility);
  const publicTitle = scrubInvestorShareText(link.publicTitle).slice(0, 200) || "Investor summary";
  const publicSubtitle = link.publicSubtitle ? scrubInvestorShareText(link.publicSubtitle).slice(0, 300) : undefined;
  return {
    publicTitle,
    publicSubtitle,
    metrics: filtered.metrics,
    sections: filtered.sections,
    narrative: filtered.narrative,
    generatedAt: internal.generatedAt,
    warnings: filtered.warnings,
  };
}

/**
 * Public entry: resolve token, bump view count once, return filtered dashboard or null (generic invalid).
 */
export async function loadPublicInvestorShareDashboard(
  rawToken: string,
): Promise<{ dashboard: InvestorSharedDashboard } | null> {
  const r = resolveToken(rawToken);
  if (!r.ok) {
    logInvestorShareInvalid(r.kind);
    return null;
  }
  const afterView = recordInvestorShareView(r.link);
  const dashboard = await buildInvestorSharedDashboard(afterView);
  return { dashboard };
}
