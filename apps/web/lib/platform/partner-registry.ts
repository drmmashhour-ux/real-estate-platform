/**
 * In-memory partner registry — load from env in production-minded deployments.
 */

import { timingSafeEqual } from "node:crypto";
import type { Partner } from "@/modules/platform/partner.types";

const DEV_KEY =
  process.env.PLATFORM_PUBLIC_API_DEV_KEY ?? "lecipm_pk_dev_local_only_change_me";

const defaultPartners: Partner[] = [
  {
    id: "partner_dev_console",
    name: "Development console",
    type: "technology",
    apiKey: DEV_KEY,
    scopes: [
      "leads:read",
      "leads:write",
      "deals:read",
      "deals:write",
      "insights:read",
      "messaging:read",
      "bookings:write",
    ],
    webhookUrl: process.env.PLATFORM_PUBLIC_WEBHOOK_URL,
  },
];

function loadFromEnv(): Partner[] {
  const raw = process.env.PLATFORM_PUBLIC_PARTNERS_JSON;
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as Partner[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => p?.id && p?.apiKey && Array.isArray(p.scopes));
  } catch {
    return [];
  }
}

const envPartners = loadFromEnv();
let partners: Partner[] = envPartners.length > 0 ? envPartners : defaultPartners;

/** Test hook: replace registry (e.g. scoped tests). */
export function __resetPartnersForTests(list: Partner[]): void {
  partners = list;
}

export function getPartners(): Partner[] {
  return [...partners];
}

export function findPartnerByApiKey(apiKey: string): Partner | undefined {
  return partners.find((p) => timingSafeEqualString(p.apiKey, apiKey));
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
