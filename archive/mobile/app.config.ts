import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ExpoConfig } from "expo/config";

const projectRoot = __dirname;

const productionApiBaseUrl = "https://lecipm.com";
/** Used only when `EXPO_PUBLIC_API_BASE_URL` is unset at prebuild (simulator / dev client). */
const devApiFallback = "http://localhost:3001";

const appVariant = process.env.APP_VARIANT?.trim() || "";
const isDevVariant = appVariant === "development";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  (isDevVariant ? devApiFallback : productionApiBaseUrl);

const defaultDeepLinkScheme = "lecipm";
const deepLinkScheme =
  process.env.EXPO_PUBLIC_MOBILE_DEEP_LINK_SCHEME?.replace(/:\/?\/?$/, "") || defaultDeepLinkScheme;

const privacyPolicyUrl =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() || "https://lecipm.com/legal/privacy";
const termsOfServiceUrl =
  process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL?.trim() || "https://lecipm.com/legal/terms";

const iconPng = join(projectRoot, "assets", "icon.png");
const splashPng = join(projectRoot, "assets", "splash.png");
const adaptiveIconPng = join(projectRoot, "assets", "adaptive-icon.png");
const notificationIconPng = join(projectRoot, "assets", "notification-icon.png");

const iosBuildNumber = process.env.IOS_BUILD_NUMBER?.trim() || "1";
const androidVersionCode = Math.max(
  1,
  Math.min(2100000000, parseInt(process.env.ANDROID_VERSION_CODE || "1", 10) || 1)
);

/** EAS Project ID — set after `eas init` (Expo dashboard → project → Project ID). Required for push + EAS Build. */
const easProjectId = process.env.EAS_PROJECT_ID?.trim() || "";

/**
 * Home screen / launcher name. App Store Connect title is often max 30 characters — if submission
 * rejects, use: `LECIPM - Stays & Hotel Booking` (ASCII hyphen, 30 chars) in ASC while keeping this
 * string or vice versa per Apple’s current rules.
 */
const APP_DISPLAY_NAME = "LECIPM Manager";

const config: ExpoConfig = {
  name: APP_DISPLAY_NAME,
  slug: "lecipm-manager",
  scheme: deepLinkScheme,
  version: process.env.APP_VERSION?.trim() || "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  description:
    "LECIPM Manager — AI-managed stays & real estate. Browse listings, book stays, and manage your profile.",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },
  ...(existsSync(notificationIconPng)
    ? {
        notification: {
          icon: "./assets/notification-icon.png",
          color: "#000000",
        },
      }
    : {}),
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#000000",
        image: "./assets/splash.png",
        resizeMode: "contain",
      },
    ],
    "expo-notifications",
    "expo-secure-store",
    [
      "expo-image-picker",
      {
        photosPermission:
          "LECIPM needs photo access to upload your government ID for optional verification.",
        cameraPermission:
          "LECIPM needs camera access if you photograph your ID for verification.",
      },
    ],
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.lecipm.app",
    buildNumber: iosBuildNumber,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.lecipm.app",
    versionCode: androidVersionCode,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
  },
  extra: {
    apiBaseUrl,
    privacyPolicyUrl,
    termsOfServiceUrl,
    /** Optional `pnpm run realtime:socket` origin (e.g. http://192.168.1.10:4010). */
    realtimeUrl: process.env.EXPO_PUBLIC_REALTIME_URL?.trim() ?? "",
    ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
    /** Fallback when reading from Constants.expoConfig.extra (same values as EXPO_PUBLIC_* at build time). */
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
};

/** Fail fast in CI / prebuild if required branding assets are missing (store submission). */
if (!existsSync(iconPng) || !existsSync(splashPng) || !existsSync(adaptiveIconPng)) {
  throw new Error(
    "Missing required assets: run `pnpm run assets:generate` in apps/mobile (or add icon.png, splash.png, adaptive-icon.png under assets/)."
  );
}

export default config;
