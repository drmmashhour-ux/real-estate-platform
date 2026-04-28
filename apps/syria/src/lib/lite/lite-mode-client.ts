/** Client-only: connection hint + localStorage override for Ultra-Lite. */
import { getNetworkMode } from "@/lib/core/network";

export const LITE_MODE_STORAGE_KEY = "lite_mode";

export type LiteModePreference = "auto" | "on" | "off";

export function readLiteModePreference(): LiteModePreference {
  if (typeof window === "undefined") return "auto";
  try {
    const v = window.localStorage.getItem(LITE_MODE_STORAGE_KEY)?.toLowerCase();
    if (v === "true" || v === "1" || v === "on") return "on";
    if (v === "false" || v === "0" || v === "off") return "off";
  } catch {
    /* ignore */
  }
  return "auto";
}

/** Effective Ultra-Lite (auto uses Network Information API when present). */
export function computeUltraLiteEffective(): boolean {
  if (typeof window === "undefined") return false;
  const pref = readLiteModePreference();
  if (pref === "on") return true;
  if (pref === "off") return false;

  return getNetworkMode() === "lite";
}
