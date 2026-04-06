import Constants from "expo-constants";

/**
 * When true, enables feedback, lightweight events, and growth UI (non-blocking).
 * Set EXPO_PUBLIC_SOFT_LAUNCH=true in env / app config — never put secrets here.
 */
export function isSoftLaunchEnabled(): boolean {
  const e = Constants.expoConfig?.extra as Record<string, string> | undefined;
  const fromExtra = e?.softLaunch === "true" || e?.softLaunch === "1";
  const fromEnv = process.env.EXPO_PUBLIC_SOFT_LAUNCH === "true" || process.env.EXPO_PUBLIC_SOFT_LAUNCH === "1";
  return fromEnv || fromExtra;
}
