import Constants from "expo-constants";

function extra(key: string): string | undefined {
  const e = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return e?.[key];
}

/** Next.js apps/web base URL (no trailing slash). */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  extra("apiBaseUrl") ??
  "http://localhost:3000";

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra("supabaseUrl") ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra("supabaseAnonKey") ?? "";
