import Constants from "expo-constants";

export { API_BASE_URL } from "../config";

function extra(key: string): string | undefined {
  const e = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return e?.[key];
}

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra("supabaseUrl") ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra("supabaseAnonKey") ?? "";
