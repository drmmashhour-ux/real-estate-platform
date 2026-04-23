import { mobileFetch } from "./apiClient";
import { supabase } from "../lib/supabase";

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function restoreSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUserRole() {
  return mobileFetch<{ appRole: string }>("/api/mobile/v1/me");
}
