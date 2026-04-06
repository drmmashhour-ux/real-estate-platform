import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

const extra = Constants.expoConfig?.extra ?? {};

/** Dev-only default when env and app.config extra omit the base URL (iOS simulator). */
const DEV_API_FALLBACK = "http://localhost:3001";

function rawApiBase(): string {
  return (
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ??
    (typeof extra.apiBaseUrl === "string" ? extra.apiBaseUrl : __DEV__ ? DEV_API_FALLBACK : "https://lecipm.com")
  );
}

/**
 * Physical phones cannot reach your Mac's `localhost`. If `.env` still points at
 * localhost, API calls fail and the app looks "stuck" after sign-in. In dev we
 * fall back to production unless you set EXPO_PUBLIC_API_BASE_URL to a LAN URL.
 *
 * Android emulator: `localhost` refers to the emulator itself; use 10.0.2.2 for the host machine.
 */
function resolveApiBase(url: string): string {
  if (
    __DEV__ &&
    Platform.OS === "android" &&
    !Device.isDevice &&
    (url.includes("localhost") || url.includes("127.0.0.1"))
  ) {
    const mapped = url.replace(/127\.0\.0\.1/g, "10.0.2.2").replace(/localhost/g, "10.0.2.2");
    if (mapped !== url) {
      console.warn("[bnhub-mobile] Android emulator: using 10.0.2.2 to reach the dev machine.");
      return mapped;
    }
  }
  if (
    __DEV__ &&
    Device.isDevice &&
    (url.includes("localhost") || url.includes("127.0.0.1"))
  ) {
    console.warn(
      "[bnhub-mobile] Physical device cannot reach localhost. Using https://lecipm.com. " +
        "For a local API, set EXPO_PUBLIC_API_BASE_URL to http://<your-LAN-IP>:3001"
    );
    return "https://lecipm.com";
  }
  return url;
}

export const API_BASE_URL = resolveApiBase(rawApiBase());

/** Socket.IO bridge (`apps/web` `pnpm run realtime:socket`). Empty = realtime disabled. */
export const REALTIME_URL = (
  process.env.EXPO_PUBLIC_REALTIME_URL?.trim() ??
  (typeof extra.realtimeUrl === "string" ? extra.realtimeUrl : "")
).replace(/\/$/, "");

if (__DEV__) {
  console.log("[API BASE]", process.env.EXPO_PUBLIC_API_BASE_URL);
}
