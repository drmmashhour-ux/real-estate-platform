import type { NextRequest } from "next/server";
import type { Partner } from "@/modules/platform/partner.types";
import { findPartnerByApiKey } from "./partner-registry";

export type PublicApiAuthFailure = { ok: false; status: number; error: string };
export type PublicApiAuthSuccess = { ok: true; partner: Partner };
export type PublicApiAuthResult = PublicApiAuthFailure | PublicApiAuthSuccess;

function extractApiKey(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim() || null;
  }
  const xKey = req.headers.get("x-api-key");
  return xKey?.trim() || null;
}

export function partnerHasScopes(partner: Partner, required: string[]): boolean {
  const set = new Set(partner.scopes);
  return required.every((s) => set.has(s));
}

/**
 * Authenticate partner API key and enforce scopes.
 */
export function authenticatePublicApi(req: NextRequest, requiredScopes: string[]): PublicApiAuthResult {
  const key = extractApiKey(req);
  if (!key) {
    return { ok: false, status: 401, error: "Missing API key (Authorization: Bearer or x-api-key)." };
  }
  const partner = findPartnerByApiKey(key);
  if (!partner) {
    return { ok: false, status: 401, error: "Invalid API key." };
  }
  if (!partnerHasScopes(partner, requiredScopes)) {
    return { ok: false, status: 403, error: `Missing required scope: ${requiredScopes.join(", ")}` };
  }
  return { ok: true, partner };
}
