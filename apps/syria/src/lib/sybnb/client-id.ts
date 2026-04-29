"use client";

import { SYBNB_SYNC_LEGACY_CLIENT_ID } from "@/lib/sybnb/sybnb-sync-constants";

const STORAGE_KEY = "client_id";
const LEGACY_STORAGE_KEY = "sybnb_sync_device_id";

/**
 * Persistent per-browser device id — send on sync payloads as `clientId`.
 * Migrates legacy `sybnb_sync_device_id` once into `client_id`.
 */
export function getClientId(): string {
  if (typeof window === "undefined") {
    return SYBNB_SYNC_LEGACY_CLIENT_ID;
  }
  try {
    let id = window.localStorage.getItem(STORAGE_KEY)?.trim();
    if (!id || id.length < 8) {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)?.trim();
      id = legacy && legacy.length >= 8 ? legacy : crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, id);
      if (legacy && legacy.length >= 8) {
        try {
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
    }
    return id;
  } catch {
    return "unknown-device";
  }
}
